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

// ==========================================
// DEEP LINKING & NAVIGATION ROUTING LOGIC
// ==========================================
const navLinks = document.querySelectorAll('#main-nav a');
const tabContents = document.querySelectorAll('.tab-content');

// Section and URL Hash mappings
const sectionMap = {
    'home': 'tab-home',
    'tab-home': 'tab-home',
    'about': 'tab-about',
    'tab-about': 'tab-about',
    'project': 'tab-project',
    'projects': 'tab-project',
    'tab-project': 'tab-project',
    'events': 'tab-events',
    'tab-events': 'tab-events',
    'certificate': 'tab-certifications',
    'certificates': 'tab-certifications',
    'certification': 'tab-certifications',
    'certifications': 'tab-certifications',
    'tab-certifications': 'tab-certifications',
    'contact': 'tab-contact',
    'tab-contact': 'tab-contact'
};

const cleanHashMap = {
    'tab-home': 'home',
    'tab-about': 'about',
    'tab-project': 'project',
    'tab-events': 'events',
    'tab-certifications': 'certificate',
    'tab-contact': 'contact'
};

// Sync canvas frame index immediately with the current scroll position
function syncCanvasToScroll(instant = false) {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScrollTop > 0) {
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScrollTop));
        targetFrameIndex = Math.min(
            frameCount - 1,
            Math.floor(scrollFraction * (frameCount - 1))
        );
        if (instant) {
            currentLoadedFrame = targetFrameIndex;
        }
    }
}

// Update active navigation link based on section ID or hash
function updateActiveNav(sectionId) {
    const cleanHash = cleanHashMap[sectionId] || sectionId;
    navLinks.forEach(link => {
        const href = (link.getAttribute('href') || '').replace(/^#/, '').toLowerCase();
        if (href === cleanHash || sectionMap[href] === sectionId || href === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Programmatic navigation to section by ID or hash alias
window.navigateToSection = function(identifier, smooth = true, updateHash = true) {
    if (!identifier) return;
    const clean = identifier.replace(/^#/, '').toLowerCase().trim();
    const targetId = sectionMap[clean] || clean;
    const targetTab = document.getElementById(targetId) || document.getElementById(clean);
    
    if (targetTab) {
        targetTab.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        
        const cleanHash = cleanHashMap[targetTab.id] || clean;
        if (updateHash) {
            if (history.pushState) {
                history.pushState(null, '', '#' + cleanHash);
            } else {
                window.location.hash = '#' + cleanHash;
            }
        }
        updateActiveNav(targetTab.id);
        
        if (!smooth) {
            syncCanvasToScroll(true);
        }
    }
};

// Nav Link click listeners
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // If modified click (Ctrl/Cmd/Middle Click), allow default browser new-tab behavior
        if (e.metaKey || e.ctrlKey || e.button === 1) {
            return;
        }
        e.preventDefault();
        const rawHref = link.getAttribute('href') || '';
        window.navigateToSection(rawHref, true, true);
    });
});

// Update active navigation link and URL hash based on scroll position
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.35 // trigger when 35% of the section is visible
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            updateActiveNav(sectionId);
            
            const cleanHash = cleanHashMap[sectionId] || sectionId;
            // Update URL hash using replaceState so browser history is clean
            if (window.location.hash !== '#' + cleanHash) {
                history.replaceState(null, '', '#' + cleanHash);
            }
        }
    });
}, observerOptions);

tabContents.forEach(tab => observer.observe(tab));

// Handle direct link opening / URL hash navigation on initial page load
function handleInitialHash() {
    const hash = window.location.hash;
    if (hash) {
        // Instant position first to prevent jump flash
        window.navigateToSection(hash, false, false);
        
        // Re-align once after DOM stabilizes
        setTimeout(() => {
            window.navigateToSection(hash, false, false);
            syncCanvasToScroll(true);
        }, 120);

        // Final smooth pass to ensure exact alignment
        setTimeout(() => {
            window.navigateToSection(hash, true, false);
            syncCanvasToScroll(true);
        }, 350);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleInitialHash);
} else {
    handleInitialHash();
}
window.addEventListener('load', handleInitialHash);

// Listen to browser Back / Forward history navigation
window.addEventListener('popstate', () => {
    const hash = window.location.hash || '#home';
    window.navigateToSection(hash, true, false);
});

// Copy direct certificate link to clipboard for forms and applications
window.copyCertLink = function() {
    const currentUrlWithoutHash = window.location.href.split('#')[0];
    const directCertUrl = currentUrlWithoutHash + '#certificate';
    const textSpan = document.getElementById('copy-cert-text');
    
    const showCopiedFeedback = () => {
        if (textSpan) {
            const prev = textSpan.textContent;
            textSpan.textContent = '✓ Link Copied!';
            setTimeout(() => {
                textSpan.textContent = prev;
            }, 2500);
        }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(directCertUrl).then(showCopiedFeedback).catch(() => {
            fallbackClipboardCopy(directCertUrl, showCopiedFeedback);
        });
    } else {
        fallbackClipboardCopy(directCertUrl, showCopiedFeedback);
    }
};

function fallbackClipboardCopy(text, callback) {
    const tempInput = document.createElement('input');
    tempInput.setAttribute('value', text);
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        if (callback) callback();
    } catch(err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(tempInput);
}

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

// ==========================================
// CERTIFICATE VIEWER MODAL LOGIC
// ==========================================
function openCertModal(src, title) {
    const modal = document.getElementById('modal-cert-viewer');
    const modalImg = document.getElementById('cert-modal-img');
    const modalTitle = document.getElementById('cert-modal-title');
    if (!modal || !modalImg) return;
    
    modalImg.src = src;
    if (modalTitle && title) {
        modalTitle.textContent = title;
    }
    openModal('modal-cert-viewer');
}

// Attach click listener to all certificate cards
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.cert-card-img').forEach(img => {
        img.addEventListener('click', () => {
            openCertModal(img.src, img.alt);
        });
    });
});

// Also attach immediately in case DOM is already loaded
document.querySelectorAll('.cert-card-img').forEach(img => {
    img.addEventListener('click', () => {
        openCertModal(img.src, img.alt);
    });
});

