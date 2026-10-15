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

// Turn off browser default scroll restoration so pasted hashes work 100% reliably
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Capture user's requested hash immediately at script execution
const initialRequestedHash = (window.location.hash || '').replace(/^#/, '').toLowerCase().trim();
let isInitialHashNavigating = Boolean(initialRequestedHash && initialRequestedHash !== 'home' && initialRequestedHash !== 'tab-home');

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

// Calculate absolute vertical position of any element in document
function getElementAbsoluteTop(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    return rect.top + scrollTop;
}

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

// Scroll directly to target element and update canvas/nav
function scrollToTarget(targetTab, smooth = false) {
    if (!targetTab) return;
    const targetY = getElementAbsoluteTop(targetTab);
    
    window.scrollTo({
        top: targetY,
        behavior: smooth ? 'smooth' : 'auto'
    });
    
    syncCanvasToScroll(true);
    updateActiveNav(targetTab.id);
}

// Programmatic navigation to section by ID or hash alias
window.navigateToSection = function(identifier, smooth = true, updateHash = true) {
    if (!identifier) return;
    const clean = identifier.replace(/^#/, '').toLowerCase().trim();
    const targetId = sectionMap[clean] || clean;
    const targetTab = document.getElementById(targetId) || document.getElementById(clean);
    
    if (targetTab) {
        // Temporarily pause scroll spy while moving
        isInitialHashNavigating = true;
        scrollToTarget(targetTab, smooth);
        
        const cleanHash = cleanHashMap[targetTab.id] || clean;
        if (updateHash) {
            if (history.pushState) {
                history.pushState(null, '', '#' + cleanHash);
            } else {
                window.location.hash = '#' + cleanHash;
            }
        }
        updateActiveNav(targetTab.id);
        
        setTimeout(() => {
            isInitialHashNavigating = false;
        }, smooth ? 700 : 50);
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
    // IMPORTANT: Do not overwrite the URL hash while landing on a requested deep link
    if (isInitialHashNavigating) return;

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

// User interaction breaks any automatic anchoring so user has full control
const stopInitialLock = () => {
    isInitialHashNavigating = false;
};
window.addEventListener('wheel', stopInitialLock, { passive: true });
window.addEventListener('touchmove', stopInitialLock, { passive: true });
window.addEventListener('keydown', stopInitialLock, { passive: true });

// Handle direct link opening / URL hash navigation on initial page load
function handleInitialDeepLink() {
    if (!initialRequestedHash) return;
    
    const targetId = sectionMap[initialRequestedHash] || initialRequestedHash;
    const targetTab = document.getElementById(targetId) || document.getElementById(initialRequestedHash);
    
    if (!targetTab) return;

    // 1. Instant jump immediately
    scrollToTarget(targetTab, false);
    
    // 2. Re-anchor as images, fonts, and layout expand
    const delays = [30, 80, 160, 300, 500, 800, 1200, 1800];
    delays.forEach(delay => {
        setTimeout(() => {
            if (isInitialHashNavigating) {
                scrollToTarget(targetTab, false);
            }
        }, delay);
    });

    // 3. Whenever an image finishes loading, re-anchor if user hasn't scrolled yet
    document.querySelectorAll('img').forEach(img => {
        if (!img.complete) {
            img.addEventListener('load', () => {
                if (isInitialHashNavigating) {
                    scrollToTarget(targetTab, false);
                }
            }, { once: true });
        }
    });

    // 4. Release lock after layout has fully settled
    setTimeout(() => {
        isInitialHashNavigating = false;
        updateActiveNav(targetTab.id);
    }, 2000);
}

// Execute initial deep link immediately and on events
handleInitialDeepLink();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleInitialDeepLink);
}
window.addEventListener('load', () => {
    if (isInitialHashNavigating && initialRequestedHash) {
        const targetId = sectionMap[initialRequestedHash] || initialRequestedHash;
        const targetTab = document.getElementById(targetId) || document.getElementById(initialRequestedHash);
        if (targetTab) scrollToTarget(targetTab, false);
    }
});

// Listen to browser Back / Forward history navigation
window.addEventListener('popstate', () => {
    const hash = window.location.hash || '#home';
    window.navigateToSection(hash, true, false);
});

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
// CERTIFICATES INVENTORY DATA & VIEWER LOGIC
// ==========================================

const CERTIFICATES_DATA = [
    // 1. CodeAlpha Offer Letter (Oct 9, 2026)
    {
        title: "Artificial Intelligence Intern — Offer Letter",
        provider: "CodeAlpha",
        date: "October 9, 2026 (Internship: Oct 10–Nov 10, 2026)",
        typeBadge: "Internship Offer Letter",
        badgeClass: "status-amber",
        credentialId: "Withheld for privacy (Student ID)",
        status: "Active / Incoming Offer (In Progress)",
        verifyUrl: null,
        assetUrl: "./certification/OneDrive_1_06-10-2026/CODE%20ALPHA%20INTERNSHIP.jpeg",
        desc: "Formal offer for a virtual Artificial Intelligence internship involving hands-on practical assignments and projects.",
        skills: ["Artificial Intelligence", "Practical Assignments", "Applied Projects", "Virtual Internship"]
    },
    // 2. YuvaIntern Offer Letter (Oct 9, 2026)
    {
        title: "Virtual Data Analysis Associate Intern — Offer Letter",
        provider: "YuvaIntern.com (Henry Harvin Education)",
        date: "October 9, 2026 (Internship: Oct 9–Nov 6, 2026)",
        typeBadge: "Internship Offer Letter",
        badgeClass: "status-amber",
        credentialId: "Not shown on certificate",
        status: "Active / Incoming Offer (In Progress)",
        verifyUrl: null,
        assetUrl: "./certification/OneDrive_1_06-10-2026/YUVA%20INTERNSHIP.jpeg",
        desc: "Remote internship offer for a Virtual Data Analysis Associate Intern role with structured modules, final project, and mentor evaluation.",
        skills: ["Data Analysis", "Structured Tasks", "Industry Evaluation", "Remote Internship"]
    },
    // 3. Microsoft SQL Server (Sep 20, 2026)
    {
        title: "Microsoft SQL Server",
        provider: "Microsoft via Coursera",
        date: "September 20, 2026",
        typeBadge: "Professional Certificate",
        badgeClass: "status-blue",
        credentialId: "Not shown separately",
        status: "Online Verified via Coursera",
        verifyUrl: "https://coursera.org/verify/professional-cert/SUJASS1SQLD9WMS",
        assetUrl: "./certification/OneDrive_1_06-10-2026/MICROSOFT%20SQL%20SERVER.jpeg",
        desc: "Covers SQL foundations, data manipulation, relational database design, transactions, indexing, performance optimization, and database security.",
        skills: ["SQL", "Microsoft SQL Server", "T-SQL", "Relational Database Design", "Transactions", "Query Optimization", "Database Security"]
    },
    // 4. Infosys AI Foundation Achievement (Jul 9, 2026)
    {
        title: "Artificial Intelligence Foundation Certification",
        provider: "Infosys Springboard / Infosys Limited",
        date: "July 9, 2026",
        typeBadge: "Certificate of Achievement",
        badgeClass: "status-gold",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code (Wingspan)",
        verifyUrl: "https://verify.onwingspan.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/INFOSYS%20AI%20FOUNDATION%20ACHIEVEMENT%20CERTIFICATE.png",
        desc: "Achievement certificate for completing the comprehensive Artificial Intelligence Foundation Certification program.",
        skills: ["AI Foundations", "Machine Intelligence", "Conceptual Frameworks"]
    },
    // 5. Nxtsync DSA Internship (Jun 1 - Jul 2, 2026)
    {
        title: "Internship in DSA",
        provider: "Nxtsync",
        date: "June 1 – July 2, 2026",
        typeBadge: "Completed Internship",
        badgeClass: "status-emerald",
        credentialId: "Not shown on certificate",
        status: "Completed Internship",
        verifyUrl: null,
        assetUrl: "./certification/OneDrive_1_06-10-2026/nextsync.jpeg",
        desc: "Successfully completed hands-on internship focusing on data structures, algorithmic problem solving, and analytical implementations.",
        skills: ["Data Structures", "Algorithms Exposure", "Algorithmic Problem Solving", "Hands-on Internship"]
    },
    // 6. Basics of Python (Jul 1, 2026)
    {
        title: "Basics of Python",
        provider: "Infosys Springboard / Infosys Limited",
        date: "July 1, 2026",
        typeBadge: "Course Completion",
        badgeClass: "status-purple",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code (Wingspan)",
        verifyUrl: "https://verify.onwingspan.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/BASIS%20OF%20PYTHON%20%28INFOSYS%29.jpeg",
        desc: "Foundational training in Python programming, covering syntax, data types, control flow, functions, and scripting techniques.",
        skills: ["Python Fundamentals", "Scripting", "Data Structures", "Automation"]
    },
    // 7. Introduction to Artificial Intelligence (Jul 1, 2026)
    {
        title: "Introduction to Artificial Intelligence",
        provider: "Infosys Springboard / Infosys Limited",
        date: "July 1, 2026",
        typeBadge: "Course Completion",
        badgeClass: "status-purple",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code (Wingspan)",
        verifyUrl: "https://verify.onwingspan.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/INTRODUCTION%20TO%20ARTIFICIAL%20INTELLIGENCE%20%28INFOSYS%29.jpeg",
        desc: "Introductory course establishing foundational concepts, terminology, history, and applications of artificial intelligence.",
        skills: ["AI Fundamentals", "Knowledge Representation", "Search Strategies", "Intelligent Systems"]
    },
    // 8. Introduction to Data Science (Jul 1, 2026)
    {
        title: "Introduction to Data Science",
        provider: "Infosys Springboard / Infosys Limited",
        date: "July 1, 2026",
        typeBadge: "Course Completion",
        badgeClass: "status-purple",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code (Wingspan)",
        verifyUrl: "https://verify.onwingspan.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/INTRODUCTION%20TO%20DATA%20SCIENCE%20.jpeg",
        desc: "Explores the end-to-end data science lifecycle, exploratory data analysis, data preparation, modeling, and business insights.",
        skills: ["Data Science Lifecycle", "Exploratory Data Analysis", "Statistical Modeling", "Data Preparation"]
    },
    // 9. Introduction to Deep Learning (Jul 1, 2026)
    {
        title: "Introduction to Deep Learning",
        provider: "Infosys Springboard / Infosys Limited",
        date: "July 1, 2026",
        typeBadge: "Course Completion",
        badgeClass: "status-purple",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code (Wingspan)",
        verifyUrl: "https://verify.onwingspan.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/INTRODUCTION%20TO%20DEEP%20LEARNING%20%28INFOSYS%29.jpeg",
        desc: "Foundational study of neural network architectures, forward & backpropagation, activation functions, and deep learning paradigms.",
        skills: ["Deep Learning Fundamentals", "Neural Networks", "Gradient Descent", "Model Architecture"]
    },
    // 10. Introduction to Natural Language Processing (Jul 1, 2026)
    {
        title: "Introduction to Natural Language Processing",
        provider: "Infosys Springboard / Infosys Limited",
        date: "July 1, 2026",
        typeBadge: "Course Completion",
        badgeClass: "status-purple",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code (Wingspan)",
        verifyUrl: "https://verify.onwingspan.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/INTRODUCTION%20TO%20LANGUAGE%20PROCESSING%20.jpeg",
        desc: "Text processing fundamentals, tokenization, language modeling, syntactic analysis, and semantic understanding foundations.",
        skills: ["NLP Fundamentals", "Text Preprocessing", "Tokenization", "Language Models", "Semantic Analysis"]
    },
    // 11. Triarch AI & ML Internship (Jun 15 - 29, 2026)
    {
        title: "Internship in Artificial Intelligence and Machine Learning",
        provider: "Triarch Private Limited",
        date: "June 15 – 29, 2026",
        typeBadge: "Completed Internship",
        badgeClass: "status-emerald",
        credentialId: "Not shown on certificate",
        status: "Completed 14-day Internship",
        verifyUrl: null,
        assetUrl: "./certification/OneDrive_1_06-10-2026/INTERNSHIP%2026.jpeg",
        desc: "Completed intensive 14-day internship covering practical machine learning workflows and artificial intelligence implementations.",
        skills: ["AI & ML Exposure", "Applied Machine Learning", "Hands-on Internship", "Model Workflows"]
    },
    // 12. AWS Infrastructure for Beginners (Jun 23, 2026)
    {
        title: "AWS Infrastructure for Beginners",
        provider: "GUVI / HCL",
        date: "June 23, 2026",
        typeBadge: "Certificate of Completion",
        badgeClass: "status-teal",
        credentialId: "2f2vA23I8i7115g5c4",
        status: "Verified via GUVI",
        verifyUrl: "https://www.guvi.in/certificate?id=2f2vA23I8i7115g5c4",
        assetUrl: "./certification/OneDrive_1_06-10-2026/guvi%20certification.png",
        desc: "Foundational understanding of Amazon Web Services (AWS) infrastructure, cloud architecture primitives, EC2, S3, and modern cloud deployment.",
        skills: ["AWS Infrastructure", "Cloud Computing", "EC2", "S3", "Cloud Architecture"]
    },
    // 13. AI Foundations for Business Professionals (Jun 14, 2026)
    {
        title: "AI Foundations for Business Professionals",
        provider: "University of Oxford via Coursera",
        date: "June 14, 2026",
        typeBadge: "Specialization Certificate",
        badgeClass: "status-blue",
        credentialId: "Not shown separately",
        status: "Online Verified via Coursera",
        verifyUrl: "https://coursera.org/verify/specialization/TVJ0OE3NCS9G",
        assetUrl: "./certification/OneDrive_1_06-10-2026/AI%20fundamental%20oxfords.png",
        desc: "Covers generative AI capabilities, responsible AI governance, real-world business use cases, and assessing strategic AI opportunities and risks.",
        skills: ["AI Fundamentals", "Generative AI", "AI Governance", "Business Use-Case Evaluation", "Responsible AI"]
    },
    // 14. Generative AI Strategic Leader (Jun 14, 2026)
    {
        title: "Generative AI Strategic Leader",
        provider: "Vanderbilt University via Coursera",
        date: "June 14, 2026",
        typeBadge: "Specialization Certificate",
        badgeClass: "status-blue",
        credentialId: "Not shown separately",
        status: "Online Verified via Coursera",
        verifyUrl: "https://coursera.org/verify/specialization/10M9KAQFHA9X",
        assetUrl: "./certification/OneDrive_1_06-10-2026/generative%20ai%20university.png",
        desc: "Comprehensive specialization covering generative AI foundations, prompt engineering for ChatGPT, deep research, and strategic agentic AI.",
        skills: ["Generative AI", "Prompt Engineering", "AI Research Workflows", "Agentic AI Concepts", "Strategic AI"]
    },
    // 15. Advanced Artificial Intelligence with Python (Jun 14, 2026)
    {
        title: "Advanced Artificial Intelligence with Python",
        provider: "Mind Luster",
        date: "June 14, 2026",
        typeBadge: "Certificate of Achievement",
        badgeClass: "status-gold",
        credentialId: "a4309f84",
        status: "Verified via Mind Luster",
        verifyUrl: "https://www.mindluster.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/mind%20luster.jpg",
        desc: "Advanced concepts in artificial intelligence implemented with Python, covering algorithmic design, data modeling, and intelligent problem solving.",
        skills: ["Python for AI", "Advanced AI Concepts", "Algorithmic Modeling", "Intelligent Systems"]
    },
    // 16. Foundations of AI and Microsoft AI & ML (Jun 2, 2026)
    {
        title: "Foundations of AI and Microsoft AI & ML",
        provider: "Microsoft via Coursera",
        date: "June 2, 2026",
        typeBadge: "Professional Certificate",
        badgeClass: "status-blue",
        credentialId: "Not shown separately",
        status: "Online Verified via Coursera",
        verifyUrl: "https://coursera.org/verify/professional-cert/ZLMDUEZ66CED",
        assetUrl: "./certification/OneDrive_1_06-10-2026/MICROSOFT%20AIML.png",
        desc: "5-course program covering AI/ML foundations, machine learning, AI infrastructure, engineering, troubleshooting agents, and Azure AI.",
        skills: ["AI & ML Foundations", "Azure AI", "Machine Learning", "AI Engineering", "Troubleshooting Agents", "Capstone Project"]
    },
    // 17. Google Data Analysis with Python (Jun 1, 2026)
    {
        title: "Google Data Analysis with Python",
        provider: "Google via Coursera",
        date: "June 1, 2026",
        typeBadge: "Specialization Certificate",
        badgeClass: "status-blue",
        credentialId: "Not shown separately",
        status: "Online Verified via Coursera",
        verifyUrl: "https://coursera.org/verify/specialization/QSAGTQFLLV48",
        assetUrl: "./certification/OneDrive_1_06-10-2026/GOOGLE%20DATA%20ANALYTICS.png",
        desc: "Python fundamentals, functions, conditionals, loops, data structures, data cleaning, and analysis using NumPy, pandas, and Jupyter Notebook.",
        skills: ["Python", "NumPy", "pandas", "Jupyter Notebook", "Data Cleaning", "Exploratory Data Analysis", "Data Validation"]
    },
    // 18. Accelerate Your Job Search with AI (Jun 1, 2026)
    {
        title: "Accelerate Your Job Search with AI",
        provider: "Google via Coursera",
        date: "June 1, 2026",
        typeBadge: "Course Certificate",
        badgeClass: "status-blue",
        credentialId: "Not shown separately",
        status: "Online Verified via Coursera",
        verifyUrl: "https://coursera.org/verify/N21EJBE3WSKI",
        assetUrl: "./certification/OneDrive_1_06-10-2026/JOB%20SEARCH%20WITH%20AI.png",
        desc: "Applying AI tools and prompting strategies to structure career planning, optimize application materials, and streamline research workflows.",
        skills: ["AI-Assisted Workflows", "Career Planning", "Prompting", "Productivity"]
    },
    // 19. Google AI (May 31, 2026)
    {
        title: "Google AI",
        provider: "Google via Coursera",
        date: "May 31, 2026",
        typeBadge: "Professional Certificate",
        badgeClass: "status-blue",
        credentialId: "Not shown separately",
        status: "Online Verified via Coursera",
        verifyUrl: "https://coursera.org/verify/professional-cert/VPA9IF6M7O55",
        assetUrl: "./certification/OneDrive_1_06-10-2026/Google%20ai.png",
        desc: "Comprehensive 7-course program covering AI for brainstorming, research, writing, data analysis, content creation, app prototyping, and responsible evaluation.",
        skills: ["AI Productivity", "Prompting", "Research", "Content Creation", "Data Analysis", "Prototyping", "Responsible AI"]
    },
    // 20. InAmigos Foundation Selection (May 23, 2026)
    {
        title: "AI Web Development Internship — Selection",
        provider: "InAmigos Foundation (via Internshala)",
        date: "May 23, 2026",
        typeBadge: "Certificate of Selection",
        badgeClass: "status-cyan",
        credentialId: "e34s07ylnx0",
        status: "Verified Selection (Internshala)",
        verifyUrl: "https://internshala.com/verify_certificate",
        assetUrl: "./certification/OneDrive_1_06-10-2026/internshala%20selection.jpeg",
        desc: "Official Certificate of Selection confirming selection for the AI Web Development internship position at InAmigos Foundation through Internshala.",
        skills: ["AI Web Development", "Internship Selection", "Full Stack AI Prototyping"]
    },
    // 21. Infosys Artificial Intelligence (Feb 26, 2026)
    {
        title: "Artificial Intelligence",
        provider: "Infosys Springboard / Infosys Limited",
        date: "February 26, 2026",
        typeBadge: "Course Completion",
        badgeClass: "status-purple",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code (Wingspan)",
        verifyUrl: "https://verify.onwingspan.com",
        assetUrl: "./certification/OneDrive_1_06-10-2026/ARTIFICIAL%20INTILIGENCE%20%28INFOSYSSPRINGBOARD%29.jpeg",
        desc: "Course completion in foundational Artificial Intelligence principles, algorithms, and practical applications across software systems.",
        skills: ["Artificial Intelligence", "Intelligent Systems", "Infosys Springboard"]
    },
    // 22. XACTITUDE IT Fest (Feb 10–11, 2026)
    {
        title: "XACTITUDE — National Intercollegiate IT Fest",
        provider: "Kristu Jayanti College (Autonomous), Bengaluru",
        date: "February 10–11, 2026",
        typeBadge: "Certificate of Participation",
        badgeClass: "status-rose",
        credentialId: "26HCK1011251",
        status: "Event Participation",
        verifyUrl: null,
        assetUrl: "./certification/OneDrive_1_06-10-2026/KJ%202K26.jpeg",
        desc: "Active participation in XACTITUDE 2026, a National Intercollegiate IT Fest organized by the Department of Computer Science.",
        skills: ["Technical Fest Participation", "IT Competitions", "Collegiate Networking"]
    },
    // 23. Udemy The Complete AI Guide (Jan 18, 2026)
    {
        title: "The Complete AI Guide: Learn ChatGPT, Generative AI & More",
        provider: "Udemy (Julian Melanson, Benza Maman)",
        date: "January 18, 2026",
        typeBadge: "Course Completion (41 hrs)",
        badgeClass: "status-purple",
        credentialId: "UC-f0412055-28a0-4881-a2ba-f731971ab299",
        status: "Online Verified via Udemy",
        verifyUrl: "https://ude.my/UC-f0412055-28a0-4881-a2ba-f731971ab299",
        assetUrl: "./certification/OneDrive_1_06-10-2026/Udemy%20ai%20learning%20.jpeg",
        desc: "41-hour masterclass exploring ChatGPT, generative AI workflows, prompt engineering, and multimodal AI productivity tools.",
        skills: ["ChatGPT", "Generative AI", "Prompt Engineering", "41 Hours Training"]
    },
    // 24. Global Innovation Hackathon 2026 (Year 2026)
    {
        title: "Global Innovation Hackathon 2026 — Build for a Better Future",
        provider: "Bharat Academix via Unstop",
        date: "Year 2026",
        typeBadge: "Hackathon Participation",
        badgeClass: "status-rose",
        credentialId: "Not shown on certificate",
        status: "Verified via QR Code on Cert",
        verifyUrl: null,
        assetUrl: "./certification/OneDrive_1_06-10-2026/UNSTOP%202.jpeg",
        desc: "Participation by Sujan S from VSB College of Engineering as Team 'sujannotagain' in the Global Innovation Hackathon 2026.",
        skills: ["Hackathon Participation", "Unstop", "Team sujannotagain", "Technical Innovation"]
    },
    // 25. Udemy AI for Strategic HR Operations (Sep 24, 2025)
    {
        title: "AI for Strategic HR Operations and Compliance [EN]",
        provider: "Udemy (Pritula Talent Academy)",
        date: "September 24, 2025",
        typeBadge: "Course Completion (3.5 hrs)",
        badgeClass: "status-purple",
        credentialId: "UC-2d5b0531-8d0d-421c-8b2d-364e98ea24a3",
        status: "Online Verified via Udemy",
        verifyUrl: "https://ude.my/UC-2d5b0531-8d0d-421c-8b2d-364e98ea24a3",
        assetUrl: "./certification/OneDrive_1_06-10-2026/udemy%20HR.jpeg",
        desc: "Focused 3.5-hour training on integrating AI tools into strategic human resources operations, talent workflows, and compliance frameworks.",
        skills: ["AI in HR", "Compliance Awareness", "HR Operations", "3.5 Hours Training"]
    }
];

// Open rich certificate modal by index
function openCertModalByIndex(index) {
    const cert = CERTIFICATES_DATA[index];
    if (!cert) return;

    const modalTitle = document.getElementById('cert-modal-title');
    const modalMeta = document.getElementById('cert-modal-meta');
    const modalBadge = document.getElementById('cert-modal-badge');
    const modalImg = document.getElementById('cert-modal-img');
    const modalDesc = document.getElementById('cert-modal-desc');
    const modalProvider = document.getElementById('cert-modal-provider');
    const modalDate = document.getElementById('cert-modal-date');
    const modalId = document.getElementById('cert-modal-id');
    const modalStatus = document.getElementById('cert-modal-status');
    const modalSkills = document.getElementById('cert-modal-skills');
    const verifyLink = document.getElementById('cert-modal-verify-link');
    const assetLink = document.getElementById('cert-modal-asset-link');

    if (modalTitle) modalTitle.textContent = cert.title;
    if (modalMeta) modalMeta.textContent = `${cert.provider} • ${cert.date}`;
    if (modalBadge) {
        modalBadge.textContent = cert.typeBadge;
        modalBadge.className = `status-badge ${cert.badgeClass}`;
    }
    if (modalImg) {
        modalImg.src = cert.assetUrl;
        modalImg.alt = cert.title;
    }
    if (modalDesc) modalDesc.textContent = cert.desc;
    if (modalProvider) modalProvider.textContent = cert.provider;
    if (modalDate) modalDate.textContent = cert.date;
    if (modalId) modalId.textContent = cert.credentialId || 'Not shown on certificate';
    if (modalStatus) modalStatus.textContent = cert.status || 'Verified';

    if (modalSkills) {
        modalSkills.innerHTML = (cert.skills || [])
            .map(skill => `<span class="glass-badge">${skill}</span>`)
            .join(' ');
    }

    if (verifyLink) {
        if (cert.verifyUrl) {
            verifyLink.href = cert.verifyUrl;
            verifyLink.style.display = 'inline-flex';
            const shortProvider = cert.provider.split(' ')[0].replace(/[^a-zA-Z]/g, '');
            verifyLink.textContent = `Verify Credential (${shortProvider || 'Online'}) ↗`;
        } else {
            verifyLink.style.display = 'none';
            verifyLink.href = '#';
        }
    }

    if (assetLink) {
        assetLink.href = cert.assetUrl;
    }

    openModal('modal-cert-viewer');
}

// Fallback certificate modal by src & title
function openCertModal(src, title) {
    const modalImg = document.getElementById('cert-modal-img');
    const modalTitle = document.getElementById('cert-modal-title');
    const modalMeta = document.getElementById('cert-modal-meta');
    const assetLink = document.getElementById('cert-modal-asset-link');
    const verifyLink = document.getElementById('cert-modal-verify-link');

    if (modalImg) modalImg.src = src;
    if (modalTitle) modalTitle.textContent = title || 'Certificate Preview';
    if (modalMeta) modalMeta.textContent = '';
    if (assetLink) assetLink.href = src;
    if (verifyLink) verifyLink.style.display = 'none';

    openModal('modal-cert-viewer');
}

// ==========================================
// CERTIFICATE FILTERING & LIVE SEARCH
// ==========================================
let currentCertFilter = 'all';
let currentCertSearch = '';

function filterCertificates() {
    const cards = document.querySelectorAll('#cert-cards-grid .cert-card');
    const countCurrent = document.getElementById('cert-count-current');
    const noResults = document.getElementById('cert-no-results');
    let visibleCount = 0;

    cards.forEach(card => {
        const categories = (card.getAttribute('data-category') || '').split(' ');
        const matchesCategory = (currentCertFilter === 'all') || categories.includes(currentCertFilter);

        let matchesSearch = true;
        if (currentCertSearch) {
            const title = (card.getAttribute('data-title') || '').toLowerCase();
            const provider = (card.getAttribute('data-provider') || '').toLowerCase();
            const skills = (card.getAttribute('data-skills') || '').toLowerCase();
            const combined = `${title} ${provider} ${skills}`;
            matchesSearch = combined.includes(currentCertSearch);
        }

        if (matchesCategory && matchesSearch) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    if (countCurrent) {
        countCurrent.textContent = visibleCount;
    }

    if (noResults) {
        noResults.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
}

function resetCertFilters() {
    currentCertFilter = 'all';
    currentCertSearch = '';
    
    const searchInput = document.getElementById('cert-search-input');
    const clearBtn = document.getElementById('cert-search-clear');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';

    document.querySelectorAll('.cert-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    filterCertificates();
}

function initCertificatesSection() {
    // Filter button event listeners
    const filterButtons = document.querySelectorAll('.cert-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCertFilter = btn.getAttribute('data-filter') || 'all';
            filterCertificates();
        });
    });

    // Search input event listeners
    const searchInput = document.getElementById('cert-search-input');
    const clearBtn = document.getElementById('cert-search-clear');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentCertSearch = (e.target.value || '').trim().toLowerCase();
            if (clearBtn) {
                clearBtn.style.display = currentCertSearch ? 'block' : 'none';
            }
            filterCertificates();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            currentCertSearch = '';
            clearBtn.style.display = 'none';
            filterCertificates();
        });
    }

    // Attach click listeners to any .cert-card-img in the DOM as fallback
    document.querySelectorAll('.cert-card-img').forEach(img => {
        img.addEventListener('click', () => {
            openCertModal(img.src, img.alt);
        });
    });
}

// Expose globals
window.openCertModalByIndex = openCertModalByIndex;
window.openCertModal = openCertModal;
window.resetCertFilters = resetCertFilters;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCertificatesSection);
} else {
    initCertificatesSection();
}


