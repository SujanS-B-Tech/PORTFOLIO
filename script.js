const canvas = document.getElementById("scroll-sequence");
const context = canvas.getContext("2d");

const frameCount = 300;
// Format numbers as 001, 002, ..., 300
const currentFrame = index => (
  `ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`
);

const images = [];

// Preload all frames for smooth playback
const preloadImages = () => {
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }
};

preloadImages();

let targetFrameIndex = 0;
let currentLoadedFrame = 0;

const render = () => {
    // Linear Interpolation (lerp) for smooth easing between frames
    currentLoadedFrame += (targetFrameIndex - currentLoadedFrame) * 0.08; 
    const index = Math.round(currentLoadedFrame);
    
    if (images[index] && images[index].complete && images[index].naturalWidth > 0) {
        const img = images[index];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const imgWidth = img.naturalWidth;
        // Crop bottom 50 pixels to remove EZGIF watermark completely before scaling
        const imgHeight = Math.max(1, img.naturalHeight - 50); 
        
        // Calculate scaling for object-fit: cover equivalent
        const hRatio = canvas.width / imgWidth;
        const vRatio = canvas.height / imgHeight;
        const ratio = Math.max(hRatio, vRatio);
        
        const centerShift_x = (canvas.width - imgWidth * ratio) / 2;
        const centerShift_y = (canvas.height - imgHeight * ratio) / 2;
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        try {
            // Remove watermark by only reading the image data above it
            context.drawImage(
                img, // source image
                0, // source X
                0, // source Y
                imgWidth, // source width
                imgHeight, // source height (cropped at bottom)
                centerShift_x, // draw X
                centerShift_y, // draw Y
                imgWidth * ratio, // draw width
                imgHeight * ratio // draw height
            );
        } catch (e) {
            console.error("Canvas draw error at frame: ", index, e);
        }
    }
    
    requestAnimationFrame(render);
};

// Start the continuous render loop
requestAnimationFrame(render);

window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
  const scrollFraction = scrollTop / maxScrollTop;
  
  targetFrameIndex = Math.min(
    frameCount - 1,
    Math.floor(scrollFraction * (frameCount - 1))
  );
});

// Tab Navigation Logic
const navLinks = document.querySelectorAll('#main-nav a');
const tabContents = document.querySelectorAll('.tab-content');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links and tabs
        navLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active-tab'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Find target id from href (e.g. #tab-home -> tab-home)
        const targetId = link.getAttribute('href').substring(1);
        const targetTab = document.getElementById(targetId);
        
        if(targetTab) {
            targetTab.classList.add('active-tab');
        }
    });
});
