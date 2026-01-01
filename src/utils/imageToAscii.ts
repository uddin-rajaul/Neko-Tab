export const convertImageToAscii = (file: File, width: number = 40, inverted: boolean = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate height to maintain aspect ratio
        // ASCII characters are roughly twice as tall as they are wide, so we adjust the height factor
        // 0.5 is a common factor for square-ish fonts, but let's try 0.55 for better proportions
        const aspectRatio = img.height / img.width;
        const height = Math.floor(width * aspectRatio * 0.55);

        canvas.width = width;
        canvas.height = height;

        // Fill white background to handle transparent images
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let asciiStr = '';
        // Density string from dark to light
        const chars = 'Ñ@#W$9876543210?!abc;:+=-,._ '; 
        const charList = inverted ? chars.split('').reverse().join('') : chars;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            
            // Calculate brightness
            const avg = (r + g + b) / 3;
            
            // Map brightness to character
            const charIndex = Math.floor((avg / 255) * (charList.length - 1));
            asciiStr += charList[charIndex];
          }
          asciiStr += '\n';
        }
        resolve(asciiStr);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
