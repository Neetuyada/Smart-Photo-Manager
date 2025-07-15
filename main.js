 class SmartPhotoGallery {
            constructor() {
                this.photos = [];
                this.currentLocation = null;
                this.intersectionObserver = null;
                this.networkInfo = null;
                this.isOptimized = false;
                this.visibleItems = 0;
                
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.initializeNetworkAPI();
                this.setupIntersectionObserver();
                this.startPerformanceMonitoring();
                
                // Generate initial photos when page loads
                setTimeout(() => {
                    this.generatePhotos();
                }, 500);
            }

            setupEventListeners() {
                document.getElementById('enableLocation').addEventListener('click', () => this.enableLocation());
                document.getElementById('generatePhotos').addEventListener('click', () => this.generatePhotos());
                document.getElementById('optimizePerformance').addEventListener('click', () => this.toggleOptimization());
            }

            // 1. GEOLOCATION API
            enableLocation() {
                const button = document.getElementById('enableLocation');
                button.disabled = true;
                button.textContent = 'Getting location...';

                if (!navigator.geolocation) {
                    this.updateStatus('locationStatus', 'Location: Not supported');
                    button.disabled = false;
                    button.textContent = 'Enable Location';
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.currentLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        };
                        
                        this.updateStatus('locationStatus', 
                            `Location: ${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}`);
                        
                        button.textContent = 'Location Enabled ✓';
                        button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                        
                        // Update existing photos with location info
                        this.updatePhotosWithLocation();
                    },
                    (error) => {
                        this.updateStatus('locationStatus', `Location: Error - ${error.message}`);
                        button.disabled = false;
                        button.textContent = 'Enable Location';
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            }

            // 2. NETWORK INFORMATION API
            initializeNetworkAPI() {
                this.networkInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                
                if (this.networkInfo) {
                    this.updateNetworkStatus();
                    this.networkInfo.addEventListener('change', () => this.updateNetworkStatus());
                } else {
                    this.updateStatus('networkStatus', 'Network: API not supported');
                }
            }

            updateNetworkStatus() {
                if (!this.networkInfo) return;
                
                const effectiveType = this.networkInfo.effectiveType;
                const downlink = this.networkInfo.downlink;
                const rtt = this.networkInfo.rtt;
                
                this.updateStatus('networkStatus', 
                    `Network: ${effectiveType} (${downlink}Mbps, ${rtt}ms RTT)`);
                
                // Show warning for slow connections
                const networkWarning = document.getElementById('networkWarning');
                if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
                    networkWarning.style.display = 'block';
                } else {
                    networkWarning.style.display = 'none';
                }
            }

            // 3. INTERSECTION OBSERVER API
            setupIntersectionObserver() {
                this.intersectionObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const photoItem = entry.target;
                            photoItem.classList.add('visible');
                            this.visibleItems++;
                            
                            // Lazy load the actual image
                            const placeholder = photoItem.querySelector('.photo-placeholder');
                            if (placeholder) {
                                this.loadPhotoImage(photoItem);
                            }
                        } else {
                            if (entry.target.classList.contains('visible')) {
                                this.visibleItems--;
                            }
                        }
                    });
                    
                    this.updateStatus('visibilityStatus', `Visible items: ${this.visibleItems}`);
                }, {
                    root: null,
                    rootMargin: '50px',
                    threshold: 0.1
                });
            }

            // 4. CANVAS API
            loadPhotoImage(photoItem) {
                const placeholder = photoItem.querySelector('.photo-placeholder');
                if (!placeholder) return;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size
                canvas.width = 300;
                canvas.height = 250;
                canvas.className = 'photo-canvas';
                canvas.style.width = '100%';
                canvas.style.height = '250px';
                canvas.style.objectFit = 'cover';

                // Determine image quality based on network
                const quality = this.getImageQuality();
                
                // Generate a procedural image
                this.generateProceduralImage(ctx, canvas.width, canvas.height, quality);
                
                // Replace placeholder with canvas
                placeholder.parentNode.replaceChild(canvas, placeholder);
                
                // Add some debug info
                console.log('Canvas image generated:', canvas.width, 'x', canvas.height, 'Quality:', quality);
            }

            generateProceduralImage(ctx, width, height, quality) {
                // Clear canvas first
                ctx.clearRect(0, 0, width, height);
                
                // Create a gradient background
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                const colors = [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
                ];
                
                const color1 = colors[Math.floor(Math.random() * colors.length)];
                const color2 = colors[Math.floor(Math.random() * colors.length)];
                
                gradient.addColorStop(0, color1);
                gradient.addColorStop(1, color2);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // Add geometric shapes based on quality
                const shapeCount = quality === 'high' ? 20 : quality === 'medium' ? 10 : 5;
                
                for (let i = 0; i < shapeCount; i++) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = Math.random() * 50 + 10;
                    
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
                
                // Add some decorative elements
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 3 + 1;
                    ctx.fillRect(x, y, size, size);
                }
                ctx.restore();
                
                // Add camera emoji in center
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('📸', width / 2, height / 2);
                
                // Add border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, width, height);
            }

            getImageQuality() {
                if (!this.networkInfo) return 'medium';
                
                const effectiveType = this.networkInfo.effectiveType;
                const downlink = this.networkInfo.downlink;
                
                if (effectiveType === '4g' && downlink > 5) return 'high';
                if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 1)) return 'medium';
                return 'low';
            }

            // 5. BACKGROUND TASKS API
            startPerformanceMonitoring() {
                this.scheduleBackgroundTask(() => {
                    this.updateStatus('performanceStatus', 
                        `Performance: ${this.isOptimized ? 'Optimized' : 'Standard'} mode`);
                });
            }

            scheduleBackgroundTask(callback) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback((deadline) => {
                        while (deadline.timeRemaining() > 0) {
                            callback();
                            break;
                        }
                        
                        // Schedule next task
                        setTimeout(() => this.scheduleBackgroundTask(callback), 2000);
                    });
                } else {
                    // Fallback for browsers without requestIdleCallback
                    setTimeout(() => {
                        callback();
                        this.scheduleBackgroundTask(callback);
                    }, 2000);
                }
            }

            toggleOptimization() {
                this.isOptimized = !this.isOptimized;
                const button = document.getElementById('optimizePerformance');
                
                if (this.isOptimized) {
                    button.textContent = 'Optimization ON ✓';
                    button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                } else {
                    button.textContent = 'Optimize Loading';
                    button.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
                }
            }

            generatePhotos() {
                const gallery = document.getElementById('gallery');
                const loadingMore = document.getElementById('loadingMore');
                
                loadingMore.style.display = 'block';
                
                // Simulate loading delay
                setTimeout(() => {
                    for (let i = 0; i < 6; i++) {
                        const photoItem = this.createPhotoItem(this.photos.length + i);
                        gallery.appendChild(photoItem);
                        
                        // Force immediate observation
                        this.intersectionObserver.observe(photoItem);
                        
                        // Add to photos array
                        this.photos.push({
                            id: this.photos.length + i,
                            created: new Date(),
                            quality: this.getImageQuality()
                        });
                    }
                    
                    loadingMore.style.display = 'none';
                    
                    // Add debug info
                    console.log('Generated', this.photos.length, 'photos total');
                }, 800);
            }

            createPhotoItem(index) {
                const locations = [
                    { name: 'Knowledge Park-II, GB', distance: 2.5 },
                    { name: 'Venice,Greater Noida', distance: 45.2 },
                    { name: 'Delhi, India', distance: 1.8 },
                    { name: 'Venice Beach, India', distance: 32.1 },
                    { name: 'Naini Bridge, India', distance: 3.2 },
                    { name: 'Lombard Street, noida', distance: 46.8 }
                ];
                
                const location = locations[index % locations.length];
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                
                const locationText = this.currentLocation 
                    ? `📍 ${location.name} (${location.distance}km away)`
                    : `📍 ${location.name}`;
                
                photoItem.innerHTML = `
                    <div class="photo-placeholder">
                        <span>Loading image...</span>
                    </div>
                    <div class="photo-info">
                        <div class="photo-location">${locationText}</div>
                        <div class="photo-title">Photo ${index + 1}</div>
                        <div class="photo-details">
                            Generated • ${new Date().toLocaleDateString()} • 
                            Quality: ${this.getImageQuality()}
                        </div>
                    </div>
                `;
                
                return photoItem;
            }

            updatePhotosWithLocation() {
                const locationElements = document.querySelectorAll('.photo-location');
                locationElements.forEach((element, index) => {
                    const locations = [
                        { name: 'Knowledge Park-II, GB', distance: 2.5 },
                        { name: 'Venice,Greater Noida', distance: 5.2 },
                        { name: 'Delhi, India', distance: 31.8 },
                        { name: 'Venice Beach, India', distance: 32.1 },
                        { name: 'Naini Bridge, India', distance: 313.2 },
                        { name: 'Lombard Street, Noida', distance: 46.8 }
                    ];
                    
                    const location = locations[index % locations.length];
                    element.textContent = `📍 ${location.name} (${location.distance}km away)`;
                });
            }

            updateStatus(elementId, text) {
                document.getElementById(elementId).textContent = text;
            }
        }

        // Initialize the gallery when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new SmartPhotoGallery();
        });