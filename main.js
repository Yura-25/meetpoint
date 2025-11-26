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

    // --- AUTH ---
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

    logout() {
        this.currentUser = null;
        localStorage.clear();
        window.location.href = 'login.html';
    }

    // --- DATA ---
    async fetchEvents() {
        try {
            const res = await fetch(`${this.API_URL}/events`);
            this.events = await res.json();
            if (this.map) this.updateMapMarkers();
            return this.events;
        } catch (err) {
            console.error('Error fetching events:', err);
            return [];
        }
    }

    // --- MAP ---
    async initializeMap(containerId) {
        const LODZ_COORDS = [51.7592, 19.4560];
        this.map = L.map(containerId).setView(LODZ_COORDS, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);

        await this.fetchEvents();
        
        this.map.on('click', (e) => {
            const locInput = document.getElementById('eventLocation');
            if (locInput) {
                locInput.value = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
                window.selectedLocation = [e.latlng.lat, e.latlng.lng];
                L.popup().setLatLng(e.latlng).setContent("📍 Location Selected").openOn(this.map);
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
        const categoryIcons = { sports: '🏃', food: '🍕', tech: '💻', social: '🎉', study: '📚' };
        const icon = categoryIcons[event.category] || '📍';
        const marker = L.marker([event.latitude, event.longitude]).addTo(this.map);
        
        // Simple Popup
        marker.bindPopup(`<b>${icon} ${event.title}</b><br>${event.address}<br><button onclick="app.joinEvent('${event.id}')" class="mt-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">View/Join</button>`);
        
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

    // --- ROBUST GEOCODING (THE FIX) ---
    async getCoordinates(address) {
        console.log("Searching for:", address);
        try {
            // Create a timeout promise that rejects after 3 seconds
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout")), 3000)
            );

            const search = fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);

            // Race the search against the timeout
            const res = await Promise.race([search, timeout]);
            const data = await res.json();

            if (data && data.length > 0) {
                console.log("Found:", data[0]);
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (err) {
            console.warn("Geocoding failed or timed out (using default location):", err);
        }
        // Return null if anything fails, so the app doesn't hang
        return null;
    }

    // Helpers
    getCategoryName(cat) { return cat.toUpperCase(); }
    formatDate(d) { return new Date(d).toLocaleDateString(); }
}

const app = new MeetPoint();
window.app = app;