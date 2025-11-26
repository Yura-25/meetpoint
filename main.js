// MeetPoint - API Connected Logic (Sprint 2 + Events Page)
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

    // --- DATA FETCHING ---
    async fetchEvents() {
        try {
            const res = await fetch(`${this.API_URL}/events`);
            this.events = await res.json();
            // If on map page, update markers
            if (this.map) this.updateMapMarkers();
            return this.events;
        } catch (err) {
            console.error('Error fetching events:', err);
            return [];
        }
    }

    // --- MAP FUNCTIONS ---
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
        const icons = { sports: '🏃', food: '🍕', tech: '💻', social: '🎉', study: '📚' };
        const icon = icons[event.category] || '📍';
        const marker = L.marker([event.latitude, event.longitude])
            .addTo(this.map)
            .bindPopup(`<b>${icon} ${event.title}</b><br>${event.description}`);
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
    getCategoryName(cat) {
        const names = { 
            sports: 'Sports & Fitness', study: 'Study & Learning', 
            social: 'Social & Entertainment', food: 'Food & Dining', 
            tech: 'Technology', travel: 'Travel', music: 'Music', art: 'Art'
        };
        return names[cat] || cat;
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleString();
    }
}

const app = new MeetPoint();
window.app = app;