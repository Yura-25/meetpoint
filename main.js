// MeetPoint - Final Sprint 2 Logic
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

    // [THIS WAS MISSING]
    async register(username, email, password) {
        try {
            const res = await fetch(`${this.API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Note: Backend expects 'name', not 'username'
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

    // --- DATA & MAP ---

    async fetchEvents() {
        try {
            const res = await fetch(`${this.API_URL}/events`);
            this.events = await res.json();
            if (this.map) this.updateMapMarkers();
            // Helper for index.html sidebar
            if (window.displayEvents) window.displayEvents(this.events);
            return this.events;
        } catch (err) {
            console.error('Error fetching events:', err);
            return [];
        }
    }

    async initializeMap(containerId) {
        const LODZ_COORDS = [51.7592, 19.4560];
        this.map = L.map(containerId).setView(LODZ_COORDS, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);

        await this.fetchEvents();
        
        // Map Click -> Prepare Event Creation
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
                
                // Update visual marker in index.html if function exists
                if (typeof updateLocationSelection === 'function') {
                    updateLocationSelection(e.latlng.lat, e.latlng.lng, "Selected from Map");
                }
                
                // Open modal if function exists
                if (typeof openModal === 'function') openModal();
            }
        });
        return this.map;
    }

    updateMapMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.markers = [];
        this.events.forEach(event => this.addEventMarker(event));
    }

    addEventMarker(event) {
        if (!this.map) return;

        const categoryIcons = {
            sports: '🏃', study: '📚', social: '🎉', food: '🍕',
            travel: '✈️', music: '🎵', art: '🎨', tech: '💻'
        };
        const icon = categoryIcons[event.category] || '📍';
        
        const creatorName = event.creator ? event.creator.name : 'Unknown';
        const isJoined = this.currentUser && event.participants && event.participants.includes(this.currentUser.id);
        const isFull = event.participants ? event.participants.length >= event.maxParticipants : false;
        const participantCount = event.participants ? event.participants.length : 0;

        const marker = L.marker([event.latitude, event.longitude]).addTo(this.map);

        marker.bindPopup(`
            <div class="p-1 min-w-[220px]">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-900 leading-tight">${event.title}</h3>
                    <span class="text-xl ml-2">${icon}</span>
                </div>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    ${event.category}
                </span>
                <p class="text-sm text-gray-600 mt-2 mb-3 line-clamp-2">${event.description}</p>
                <div class="space-y-1 text-xs text-gray-500 mb-3">
                    <div class="flex items-center">
                        <i class="fas fa-map-marker-alt w-4 text-center mr-1"></i>
                        <span class="truncate max-w-[180px]">${event.address}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-users w-4 text-center mr-1"></i>
                        ${participantCount}/${event.maxParticipants} joined
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-user w-4 text-center mr-1"></i>
                        By ${creatorName}
                    </div>
                </div>
                <button 
                    onclick="app.joinEvent('${event.id}')" 
                    class="w-full py-1.5 rounded text-sm font-medium transition-colors ${
                        isJoined 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : isFull 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }"
                    ${isFull && !isJoined ? 'disabled' : ''}
                >
                    ${isJoined ? 'Joined ✓' : isFull ? 'Full' : 'Join Event'}
                </button>
            </div>
        `);

        this.markers.push({ id: event.id, marker });
    }

    // --- ACTIONS ---

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
                    title, description, category, datetime,
                    maxParticipants: parseInt(maxParticipants),
                    latitude: location[0], longitude: location[1],
                    address: address || "Map Location"
                })
            });
            if (res.ok) {
                await this.fetchEvents();
                return { success: true };
            }
            const err = await res.json();
            return { success: false, message: err.error };
        } catch (e) { return { success: false, message: 'Network error' }; }
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

    // --- HELPERS ---

    async getCoordinates(address) {
        try {
            // 3s timeout to prevent hanging
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

    getCategoryName(cat) { return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : ''; }
    formatDate(d) { return new Date(d).toLocaleDateString(); }
}

const app = new MeetPoint();
window.app = app;