const canvas = document.getElementById("scroll-sequence");
const context = canvas.getContext("2d");

const frameCount = 300;
// Format numbers as 001, 002, ..., 300
const currentFrame = index => (
  `photos/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`
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

// Smooth Scrolling Navigation Logic
const navLinks = document.querySelectorAll('#main-nav a');
const tabContents = document.querySelectorAll('.tab-content');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetTab = document.getElementById(targetId);
        
        if(targetTab) {
            targetTab.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Update active navigation link based on scroll position
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5 // trigger when 50% of the section is visible
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').substring(1) === entry.target.id) {
                    link.classList.add('active');
                }
            });
        }
    });
}, observerOptions);

tabContents.forEach(tab => observer.observe(tab));

// ==========================================
// MODAL SYSTEM LOGIC
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Show modal
    modal.classList.add('active');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

function closeModal(event, modalId) {
    // If event exists, ensure we didn't click inside the modal-content
    if (event) {
        // Prevent closing if clicking on the actual content box, only close on overlay or 'x'
        if (event.target.classList.contains('modal-content') || event.target.closest('.modal-content') && !event.target.classList.contains('modal-close')) {
            return;
        }
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Restore background scrolling
    document.body.style.overflow = '';
}

// Global ESC key listener to close active modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            closeModal(null, activeModal.id);
        }
    }
});

// ==========================================
// CAROUSEL SYSTEM LOGIC
// ==========================================
const carousels = {};

window.moveCarousel = function(event, id, direction) {
    if (event) event.stopPropagation(); 
    if (carousels[id] === undefined) carousels[id] = 0;
    
    const container = document.getElementById(id);
    if (!container) return;
    
    const slides = container.querySelectorAll('.slide');
    const totalSlides = slides.length;
    
    carousels[id] += direction;
    
    if (carousels[id] >= totalSlides) carousels[id] = 0;
    if (carousels[id] < 0) carousels[id] = totalSlides - 1;
    
    slides.forEach(slide => {
        slide.style.transform = `translateX(-${carousels[id] * 100}%)`;
    });
};
