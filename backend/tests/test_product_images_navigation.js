const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const assert = require('assert');
const fs = require('fs');
const { pool, checkConnection } = require('../config/db');
const authService = require('../services/auth.service');
const productService = require('../services/product.service');
const productImageModel = require('../models/product_image.model');
const { validateFileSignatures } = require('../middleware/upload');

async function runTests() {
  console.log('--- Starting Product Image Upload & Navigation Tests ---');

  await checkConnection();

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const sellerEmail = `img_seller_${rand}@test.com`;
  const otherSellerEmail = `other_seller_${rand}@test.com`;
  const password = 'Password@123';

  // 1. Create Sellers
  console.log('1. Registering test sellers...');
  const sellerAuth = await authService.register({
    name: `Image Seller ${rand}`,
    email: sellerEmail,
    password,
    phone: '9800000010',
    role: 'SELLER',
  });

  const otherSellerAuth = await authService.register({
    name: `Other Seller ${rand}`,
    email: otherSellerEmail,
    password,
    phone: '9800000011',
    role: 'SELLER',
  });

  let [catRows] = await pool.query('SELECT id FROM categories LIMIT 1');
  let catId = catRows[0] ? catRows[0].id : null;
  if (!catId) {
    const [res] = await pool.query("INSERT INTO categories (name, slug) VALUES ('Electronics', 'electronics')");
    catId = res.insertId;
  }

  // 2. Test Magic Number Validation Utility
  console.log('2. Testing magic number validation for file uploads...');
  const tmpDir = path.join(__dirname, '..', '..', 'uploads', 'products');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Valid JPEG header: FF D8 FF E0
  const validJpgPath = path.join(tmpDir, `test_valid_${rand}.jpg`);
  fs.writeFileSync(validJpgPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x00, 0x00, 0x00, 0x00]));
  assert.doesNotThrow(() => validateFileSignatures([{ path: validJpgPath }]), 'Valid JPEG magic number should be accepted');

  // Valid PNG header: 89 50 4E 47 0D 0A 1A 0A
  const validPngPath = path.join(tmpDir, `test_valid_${rand}.png`);
  fs.writeFileSync(validPngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]));
  assert.doesNotThrow(() => validateFileSignatures([{ path: validPngPath }]), 'Valid PNG magic number should be accepted');

  // Valid WEBP header: RIFF....WEBP
  const validWebpPath = path.join(tmpDir, `test_valid_${rand}.webp`);
  const webpBuf = Buffer.alloc(16);
  webpBuf.write('RIFF', 0);
  webpBuf.write('WEBP', 8);
  fs.writeFileSync(validWebpPath, webpBuf);
  assert.doesNotThrow(() => validateFileSignatures([{ path: validWebpPath }]), 'Valid WEBP magic number should be accepted');

  // Invalid disguised file (e.g. PHP script with .jpg extension)
  const fakeJpgPath = path.join(tmpDir, `test_fake_${rand}.jpg`);
  fs.writeFileSync(fakeJpgPath, '<?php echo "malicious"; ?>');
  assert.throws(() => validateFileSignatures([{ path: fakeJpgPath }]), /INVALID_IMAGE_SIGNATURE|invalid/, 'Disguised text file should be rejected by magic number validator');

  // Cleanup test files
  [validJpgPath, validPngPath, validWebpPath, fakeJpgPath].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  console.log('✔ Magic number header checks successfully pass genuine images and reject spoofed files.');

  // 3. Test Creating Product with Multiple Images & Primary Designation
  console.log('3. Creating product with multi-image gallery...');
  const initialImages = [
    { url: `/uploads/products/front_${rand}.jpg`, storage_path: `products/front_${rand}.jpg`, is_primary: false, sort_order: 0 },
    { url: `/uploads/products/hero_${rand}.png`, storage_path: `products/hero_${rand}.png`, is_primary: true, sort_order: 1 },
    { url: `/uploads/products/side_${rand}.webp`, storage_path: `products/side_${rand}.webp`, is_primary: false, sort_order: 2 },
  ];

  const product = await productService.createProduct(sellerAuth.user, {
    title: `Premium DSLR Camera ${rand}`,
    description: 'High-end mirrorless camera with 4K video recording and dual pixel autofocus.',
    price: 74999.00,
    stock: 5,
    condition: 'NEW',
    category_id: catId,
    images: initialImages,
  });

  assert(product.id, 'Product should be created');
  assert.strictEqual(product.title, `Premium DSLR Camera ${rand}`);
  assert(Array.isArray(product.images), 'Product images should be an array');
  assert.strictEqual(product.images.length, 3, 'Should have 3 images');
  // Primary image should be normalized to index 0 in the images array
  assert.strictEqual(product.images[0], `/uploads/products/hero_${rand}.png`, 'Primary image should be first in images array');
  assert.strictEqual(product.primary_image, `/uploads/products/hero_${rand}.png`, 'primary_image field should match hero image');

  // Verify DB relational entries in product_images
  const dbImages = await productImageModel.findByProduct(product.id);
  assert.strictEqual(dbImages.length, 3, 'DB should have 3 product_images rows');
  const primaryDbImg = dbImages.find((img) => Boolean(img.is_primary));
  assert(primaryDbImg, 'One image in DB must have is_primary = true');
  assert.strictEqual(primaryDbImg.image_url, `/uploads/products/hero_${rand}.png`);
  console.log('✔ Multi-image product creation and primary image normalization succeeded.');

  // 4. Test Updating Product Images (Reordering & Changing Primary)
  console.log('4. Testing image reordering and switching primary image...');
  const updatedImages = [
    { id: dbImages[2].id, url: dbImages[2].image_url, is_primary: true, sort_order: 0 }, // side is now primary
    { id: dbImages[0].id, url: dbImages[0].image_url, is_primary: false, sort_order: 1 },
    { id: dbImages[1].id, url: dbImages[1].image_url, is_primary: false, sort_order: 2 },
  ];

  const updatedProduct = await productService.updateProduct(product.id, sellerAuth.user, {
    price: 72999.00,
    images: updatedImages,
  });

  assert.strictEqual(Number(updatedProduct.price), 72999.00);
  assert.strictEqual(updatedProduct.images[0], `/uploads/products/side_${rand}.webp`, 'New primary should be first in images array');
  assert.strictEqual(updatedProduct.primary_image, `/uploads/products/side_${rand}.webp`);

  const updatedDbImages = await productImageModel.findByProduct(product.id);
  const newPrimary = updatedDbImages.find((i) => Boolean(i.is_primary));
  assert(newPrimary, 'Must have active primary');
  assert.strictEqual(newPrimary.image_url, `/uploads/products/side_${rand}.webp`);
  console.log('✔ Product image update and primary switch succeeded.');

  // 5. Test Dedicated Primary Image Endpoint Service Method
  console.log('5. Testing setProductPrimaryImage service...');
  const targetImageToSet = updatedDbImages.find((i) => i.image_url.includes('front'));
  await productService.setProductPrimaryImage(product.id, sellerAuth.user, targetImageToSet.id);

  const reloadedProd = await productService.getProductDetail(product.id, sellerAuth.user);
  assert.strictEqual(reloadedProd.primary_image, targetImageToSet.image_url, 'Primary image should match newly set primary');
  assert.strictEqual(reloadedProd.images[0], targetImageToSet.image_url, 'Primary image should be index 0');
  console.log('✔ Dedicated setProductPrimaryImage service succeeded.');

  // 6. Test Unauthorized Update/Delete Attempts (Seller Ownership Guard)
  console.log('6. Testing seller ownership security checks...');
  let ownershipErrorCaught = false;
  try {
    await productService.setProductPrimaryImage(product.id, otherSellerAuth.user, targetImageToSet.id);
  } catch (err) {
    ownershipErrorCaught = true;
    assert.strictEqual(err.statusCode, 403, 'Should reject unauthorized seller with 403 Forbidden');
  }
  assert(ownershipErrorCaught, 'Unauthorized seller must NOT be allowed to alter images');

  let deleteImageErrorCaught = false;
  try {
    await productService.deleteProductImage(product.id, otherSellerAuth.user, targetImageToSet.id);
  } catch (err) {
    deleteImageErrorCaught = true;
    assert.strictEqual(err.statusCode, 403, 'Should reject unauthorized seller deletion with 403');
  }
  assert(deleteImageErrorCaught, 'Unauthorized seller must NOT delete product images');
  console.log('✔ Ownership verification securely prevents unauthorized image alterations.');

  // 7. Test Deleting Single Product Image
  console.log('7. Testing deleteProductImage service with fallback primary promotion...');
  // Delete current primary image -> another image should automatically become primary
  await productService.deleteProductImage(product.id, sellerAuth.user, targetImageToSet.id);

  const afterDeleteImages = await productImageModel.findByProduct(product.id);
  assert.strictEqual(afterDeleteImages.length, 2, 'Should now have 2 images remaining');
  const activePrimaryAfterDelete = afterDeleteImages.find((i) => Boolean(i.is_primary));
  assert(activePrimaryAfterDelete, 'Remaining image should automatically be promoted to primary');
  console.log('✔ Deleting image and automatic primary promotion succeeded.');

  // 8. Test Product Image Limit (> 8 images)
  console.log('8. Testing maximum 8 image constraint...');
  const nineImages = [];
  for (let i = 0; i < 9; i++) {
    nineImages.push({ url: `/uploads/products/img_${i}_${rand}.jpg`, is_primary: i === 0, sort_order: i });
  }

  let limitErrorCaught = false;
  try {
    await productService.createProduct(sellerAuth.user, {
      title: `Overlimit Product ${rand}`,
      description: 'Attempting to create product with 9 images.',
      price: 1000.00,
      stock: 1,
      condition: 'NEW',
      category_id: catId,
      images: nineImages,
    });
  } catch (err) {
    limitErrorCaught = true;
    assert(err.message.includes('8 images') || err.statusCode === 400, 'Error should mention 8 images limit');
  }
  assert(limitErrorCaught, 'Product with > 8 images must be rejected');
  console.log('✔ Maximum 8 images limit is strictly enforced.');

  // 9. Test Full Product Deletion with Physical File Cleanup
  console.log('9. Testing product deletion and image table cascade cleanup...');
  // Create a dummy image file on disk to test unlink
  const dummyFilePath = path.join(tmpDir, `cleanup_test_${rand}.jpg`);
  fs.writeFileSync(dummyFilePath, Buffer.from([0xff, 0xd8, 0xff, 0xe0]));

  const cleanupProd = await productService.createProduct(sellerAuth.user, {
    title: `Product to delete ${rand}`,
    description: 'Will be deleted to test file unlinking.',
    price: 500.00,
    stock: 2,
    condition: 'NEW',
    category_id: catId,
    images: [{ url: `/uploads/products/cleanup_test_${rand}.jpg`, storage_path: `products/cleanup_test_${rand}.jpg`, is_primary: true }],
  });

  assert(fs.existsSync(dummyFilePath), 'Dummy file should exist before deletion');
  await productService.deleteProduct(cleanupProd.id, sellerAuth.user);

  const cleanupDbImages = await productImageModel.findByProduct(cleanupProd.id);
  assert.strictEqual(cleanupDbImages.length, 0, 'Relational product images should be deleted');
  assert(!fs.existsSync(dummyFilePath), 'Physical image file should be deleted from disk upon product deletion');
  console.log('✔ Product deletion cleanly unlinks image records and disk files.');

  console.log('\n======================================================');
  console.log(' ALL PRODUCT IMAGE UPLOAD & NAVIGATION TESTS PASSED! ');
  console.log('======================================================');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
