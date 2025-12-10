// MeetPoint - Complete with Friends & Profile System
class MeetPoint {
    constructor() {
        this.API_URL = 'http://localhost:3000/api';
        this.currentUser = null;
        this.map = null;
        this.events = [];
        this.markers = [];
        this.loadUserSession();
    }

    loadUserSession() {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (userStr && token) {
            this.currentUser = JSON.parse(userStr);
        }
    }

    // --- AUTHENTICATION ---
    
    async login(email, password) {
        try {
            const res = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                this.currentUser = data.user;
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true, user: data.user };
            }
            return { success: false, message: data.error || 'Login failed' };
        } catch (error) {
            return { success: false, message: 'Server connection error' };
        }
    }

    async register(username, email, password) {
        try {
            const res = await fetch(`${this.API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, email, password }) 
            });

            const data = await res.json();

            if (res.ok) {
                return { success: true };
            } else {
                return { success: false, message: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Server error' };
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.clear();
        window.location.href = 'login.html';
    }

    // --- FRIENDS MANAGEMENT ---

    async getFriends() {
        if (!this.currentUser) return [];
        try {
            const res = await fetch(`${this.API_URL}/friends`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                return await res.json();
            }
            return [];
        } catch (error) {
            console.error('Get friends error:', error);
            return [];
        }
    }

    async addFriend(email) {
        if (!this.currentUser) return { success: false, message: 'Login required' };
        try {
            const res = await fetch(`${this.API_URL}/friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true };
            }
            return { success: false, message: data.error || 'Failed to add friend' };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    async removeFriend(friendId) {
        if (!this.currentUser) return { success: false, message: 'Login required' };
        try {
            const res = await fetch(`${this.API_URL}/friends/${friendId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    // --- PROFILE MANAGEMENT ---

    async updateProfile(updates) {
        if (!this.currentUser) return { success: false, message: 'Login required' };
        try {
            const res = await fetch(`${this.API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true, user: data.user };
            }
            return { success: false, message: data.error || 'Update failed' };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    // --- DATA & MAP ---

    async fetchEvents() {
        try {
            const res = await fetch(`${this.API_URL}/events`);
            this.events = await res.json();
            
            if (this.map) this.updateMapMarkers();
            
            if (window.displayEvents) window.displayEvents(this.events);
            if (window.updateStats) window.updateStats(); 

            return this.events;
        } catch (err) {
            console.error('Error fetching events:', err);
            return [];
        }
    }

    async initializeMap(containerId) {
        const LODZ_COORDS = [51.7592, 19.4560];
        this.map = L.map(containerId).setView(LODZ_COORDS, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
            attribution: '© OpenStreetMap' 
        }).addTo(this.map);

        await this.fetchEvents();
        
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('eventId');
        if (eventId) {
            this.centerOnEvent(eventId);
        }
        
        this.map.on('click', (e) => {
            const locInput = document.getElementById('eventLocation');
            if (locInput) {
                const lat = e.latlng.lat.toFixed(4);
                const lng = e.latlng.lng.toFixed(4);
                locInput.value = `${lat}, ${lng}`;
                window.selectedLocation = [e.latlng.lat, e.latlng.lng];
                
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent("📍 Location Selected")
                    .openOn(this.map);
            }
        });
        return this.map;
    }

    centerOnEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            this.map.setView([event.latitude, event.longitude], 16);
            
            const markerObj = this.markers.find(m => m.id === eventId);
            if (markerObj) {
                markerObj.marker.openPopup();
            }
        }
    }

    updateMapMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.markers = [];
        this.events.forEach(event => this.addEventMarker(event));
    }

    createCustomMarkerIcon(category) {
        const iconConfig = {
            sports: { color: '#10b981', shape: 'pin', icon: '🏃' },
            study: { color: '#3b82f6', shape: 'pin', icon: '📚' },
            social: { color: '#f59e0b', shape: 'pin', icon: '🎉' },
            food: { color: '#ef4444', shape: 'circle', icon: '🍕' },
            travel: { color: '#06b6d4', shape: 'pin', icon: '✈️' },
            music: { color: '#8b5cf6', shape: 'note', icon: '♪' },
            art: { color: '#ec4899', shape: 'pin', icon: '🎨' },
            tech: { color: '#6366f1', shape: 'pin', icon: '💻' },
            none: { color: '#6b7280', shape: 'pin', icon: '📍' }
        };

        const config = iconConfig[category] || iconConfig.none;
        
        let markerHTML;
        
        if (config.shape === 'note') {
            markerHTML = `
                <div class="marker-music-note marker-pulse">
                    <div style="color: white; font-size: 20px; font-weight: bold; 
                                position: absolute; top: 50%; left: 50%; 
                                transform: translate(-50%, -50%);">♪</div>
                </div>
            `;
        } else if (config.shape === 'circle') {
            markerHTML = `
                <div style="width: 40px; height: 40px; background: ${config.color}; 
                            border-radius: 50%; border: 3px solid white; 
                            box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; 
                            align-items: center; justify-content: center; font-size: 20px;"
                     class="marker-pulse">
                    ${config.icon}
                </div>
            `;
        } else {
            markerHTML = `
                <div class="custom-marker marker-pulse" 
                     style="background: linear-gradient(135deg, ${config.color}, ${this.darkenColor(config.color)});">
                    <div class="custom-marker-icon">${config.icon}</div>
                </div>
            `;
        }

        return L.divIcon({
            html: markerHTML,
            className: 'custom-marker-container',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
    }

    darkenColor(color) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.max(0, (num >> 16) - 30);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - 30);
        const b = Math.max(0, (num & 0x0000FF) - 30);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    addEventMarker(event) {
        if (!this.map) return;

        const creatorName = event.creator ? event.creator.username : 'Unknown';
        const isJoined = this.currentUser && event.participants && event.participants.includes(this.currentUser.id);
        const isFull = event.participants ? event.participants.length >= event.maxParticipants : false;
        const participantCount = event.participants ? event.participants.length : 0;
        const isCreator = this.currentUser && event.creator && event.creator.id === this.currentUser.id;
        
        let btnClass = 'mp-popup-btn ';
        let btnText = '';
        
        if (isJoined) {
            btnClass += 'mp-btn-joined';
            btnText = '<i class="fas fa-check mr-1"></i> Joined';
        } else if (isFull) {
            btnClass += 'mp-btn-full';
            btnText = 'Event Full';
        } else {
            btnClass += 'mp-btn-join';
            btnText = 'Join Event';
        }

        const customIcon = this.createCustomMarkerIcon(event.category);
        const marker = L.marker([event.latitude, event.longitude], { icon: customIcon }).addTo(this.map);

        const creatorButtons = isCreator ? `
            <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button onclick="app.showEditEventModal('${event.id}')" 
                        class="mp-popup-btn" 
                        style="background: #f59e0b; color: white; flex: 1;">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="app.deleteEvent('${event.id}')" 
                        class="mp-popup-btn" 
                        style="background: #ef4444; color: white; flex: 1;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        ` : '';

        marker.bindPopup(`
            <div class="mp-popup-card">
                <div class="mp-popup-header">
                    <h3 class="mp-popup-title">${event.title}</h3>
                </div>
                
                <span class="mp-popup-category">${event.category || 'No Category'}</span>
                <p class="mp-popup-desc">${event.description}</p>
                
                <div class="mp-popup-meta">
                    <div class="mp-meta-row">
                        <i class="fas fa-map-marker-alt mp-meta-icon"></i>
                        <span class="truncate">${event.address}</span>
                    </div>
                    <div class="mp-meta-row">
                        <i class="fas fa-calendar-alt mp-meta-icon"></i>
                        <span>${new Date(event.datetime).toLocaleDateString()}</span>
                    </div>
                    <div class="mp-meta-row">
                        <i class="fas fa-users mp-meta-icon"></i>
                        <span>${participantCount}/${event.maxParticipants} participants</span>
                    </div>
                    <div class="mp-meta-row">
                        <i class="fas fa-user mp-meta-icon"></i>
                        <span>By ${creatorName}</span>
                    </div>
                </div>

                <button 
                    onclick="app.joinEvent('${event.id}')" 
                    class="${btnClass}"
                    ${isFull && !isJoined ? 'disabled' : ''}
                >
                    ${btnText}
                </button>
                
                ${creatorButtons}
            </div>
        `);

        this.markers.push({ id: event.id, marker });
    }

    // --- CRUD ACTIONS ---

    async createEvent(title, description, category, location, address, datetime, maxParticipants) {
        if (!this.currentUser) return { success: false, message: 'Login required' };
        try {
            const res = await fetch(`${this.API_URL}/events`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title, description, 
                    category: category || 'none',
                    datetime,
                    maxParticipants: parseInt(maxParticipants),
                    latitude: location[0], 
                    longitude: location[1],
                    address: address || "Map Location"
                })
            });
            if (res.ok) {
                await this.fetchEvents();
                return { success: true };
            }
            const err = await res.json();
            return { success: false, message: err.error };
        } catch (e) { 
            return { success: false, message: 'Network error' }; 
        }
    }

    async editEvent(eventId, updates) {
        if (!this.currentUser) return { success: false, message: 'Login required' };
        try {
            const res = await fetch(`${this.API_URL}/events/${eventId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                await this.fetchEvents();
                return { success: true };
            }
            const err = await res.json();
            return { success: false, message: err.error || 'Update failed' };
        } catch (e) { 
            return { success: false, message: 'Network error' }; 
        }
    }

    async deleteEvent(eventId) {
        if (!this.currentUser) return { success: false, message: 'Login required' };
        
        if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) {
            return { success: false, message: 'Cancelled' };
        }

        try {
            const res = await fetch(`${this.API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                await this.fetchEvents();
                if (window.showNotification) {
                    window.showNotification('Event deleted successfully', 'success');
                }
                return { success: true };
            }
            const err = await res.json();
            return { success: false, message: err.error || 'Delete failed' };
        } catch (e) { 
            return { success: false, message: 'Network error' }; 
        }
    }

    async joinEvent(eventId) {
        if (!this.currentUser) return { success: false, message: 'Login required' };
        try {
            const res = await fetch(`${this.API_URL}/events/${eventId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                await this.fetchEvents();
                return { success: true };
            }
            return { success: false, message: 'Could not join' };
        } catch (e) { return { success: false, message: 'Network error' }; }
    }

    showEditEventModal(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        window.editingEventId = eventId;

        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventCategory').value = event.category || 'none';
        document.getElementById('maxParticipants').value = event.maxParticipants;
        
        const dt = new Date(event.datetime);
        const formatted = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        document.getElementById('eventDatetime').value = formatted;
        
        document.getElementById('eventLocation').value = event.address;
        window.selectedLocation = [event.latitude, event.longitude];

        const modalTitle = document.querySelector('#createEventModal h3');
        if (modalTitle) modalTitle.textContent = 'Edit Event';
        
        const submitBtn = document.querySelector('#createEventForm button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Event';

        document.getElementById('createEventModal').classList.remove('hidden');
    }

    // --- HELPERS ---

    async getCoordinates(address) {
        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
            const search = fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            
            const res = await Promise.race([search, timeout]);
            const data = await res.json();

            if (data && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (err) {
            console.warn("Geocoding failed:", err);
        }
        return null;
    }

    clearMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.markers = [];
    }

    getCategoryName(cat) { return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'No Category'; }
    formatDate(d) { return new Date(d).toLocaleDateString(); }
}

const app = new MeetPoint();
window.app = app;