// MeetPoint - API Connected Logic (Sprint 2)
class MeetPoint {
    constructor() {
        // POINT TO YOUR BACKEND
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
            } else {
                return { success: false, message: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Server error. Is backend running?' };
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.clear();
        window.location.href = 'login.html';
    }

    // --- MAP & EVENTS ---
    async initializeMap(containerId) {
        // CENTER ON ŁÓDŹ
        const LODZ_COORDS = [51.7592, 19.4560];
        
        this.map = L.map(containerId).setView(LODZ_COORDS, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        await this.fetchEvents();
        
        // Map Click -> Prepare Event Creation
        this.map.on('click', (e) => {
            // Only allow if modal exists (user is on map page)
            const locationInput = document.getElementById('eventLocation');
            if (locationInput) {
                const lat = e.latlng.lat.toFixed(4);
                const lng = e.latlng.lng.toFixed(4);
                locationInput.value = `${lat}, ${lng}`;
                window.selectedLocation = [e.latlng.lat, e.latlng.lng];
                
                // Show popup feedback
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent("📍 Location Selected! Open 'Create Event' to save.")
                    .openOn(this.map);
            }
        });

        return this.map;
    }

    async fetchEvents() {
        try {
            const res = await fetch(`${this.API_URL}/events`);
            this.events = await res.json();
            this.updateMapMarkers();
            
            // Update Sidebar List if function exists
            if (window.displayEvents) window.displayEvents(this.events);
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    }

    updateMapMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.markers = [];
        this.events.forEach(event => this.addEventMarker(event));
    }

    addEventMarker(event) {
        if (!this.map) return;

        const icons = { sports: '🏃', food: '🍕', tech: '💻', social: '🎉' };
        const icon = icons[event.category] || '📍';

        const marker = L.marker([event.latitude, event.longitude])
            .addTo(this.map)
            .bindPopup(`
                <div class="p-2">
                    <div class="font-bold text-lg">${icon} ${event.title}</div>
                    <div class="text-sm">${event.description}</div>
                    <div class="text-xs text-gray-500 mt-1">📍 ${event.address}</div>
                    <div class="text-xs text-gray-500">👤 ${event.creator?.username || 'User'}</div>
                </div>
            `);

        this.markers.push({ id: event.id, marker });
    }

    // --- CREATE EVENT ---
    async createEvent(title, description, category, location, address, datetime, maxParticipants) {
        if (!this.currentUser) return { success: false, message: 'Please login first' };

        try {
            const token = localStorage.getItem('token');
            const payload = {
                title, description, category, datetime,
                maxParticipants: parseInt(maxParticipants),
                latitude: location[0],
                longitude: location[1],
                address: address || "Map Location"
            };

            const res = await fetch(`${this.API_URL}/events`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await this.fetchEvents();
                return { success: true };
            } else {
                const err = await res.json();
                return { success: false, message: err.error };
            }
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }
    
    // Helpers for UI
    searchEvents(query) {
        return this.events.filter(e => e.title.toLowerCase().includes(query.toLowerCase()));
    }
    
    formatDate(date) { return new Date(date).toLocaleDateString(); }
    
    getEventsByCategory(cat) {
        return this.events.filter(e => e.category === cat);
    }
}

const app = new MeetPoint();
window.app = app;