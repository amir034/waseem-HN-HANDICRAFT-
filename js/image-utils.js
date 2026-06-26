async function finalizeImageData(dataUrl) {
  if (typeof persistImageDataUrl === 'function') {
    return persistImageDataUrl(dataUrl);
  }
  return dataUrl;
}

function cropImageToSquare(source, size = 600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}

function readAndCropImageFile(file, callback) {
  if (!file) return;
  cropImageToSquare(file)
    .then(finalizeImageData)
    .then(callback)
    .catch(() => {
      if (typeof showToast === 'function') showToast('Failed to process image.');
    });
}

function cropImageToHero(source, width = 1200) {
  const height = Math.round(width * 9 / 16);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const targetAspect = 16 / 9;
      const imgAspect = img.width / img.height;
      let sx, sy, sw, sh;
      if (imgAspect > targetAspect) {
        sh = img.height;
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / targetAspect;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}

function readAndCropHeroFile(file, callback) {
  if (!file) return;
  cropImageToHero(file)
    .then(finalizeImageData)
    .then(callback)
    .catch(() => {
      if (typeof showToast === 'function') showToast('Failed to process image.');
    });
}

function readAndCropHeroUrl(url, callback) {
  if (!url) return;
  cropImageToHero(url)
    .then(finalizeImageData)
    .then(callback)
    .catch(() => {
      if (typeof showToast === 'function') showToast('Could not load image from URL.');
    });
}

function readAndCropSquareUrl(url, callback) {
  if (!url) return;
  cropImageToSquare(url)
    .then(finalizeImageData)
    .then(callback)
    .catch(() => {
      if (typeof showToast === 'function') showToast('Could not load image from URL.');
    });
}
