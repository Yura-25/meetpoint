// MeetPoint - Main Application Logic
class MeetPoint {
    constructor() {
        this.currentUser = null;
        this.map = null;
        this.events = [];
        this.users = [];
        this.messages = [];
        this.friends = new Map();
        this.markers = [];
        
        this.initializeDatabase();
        this.loadUserData();
    }

    // Database Management
    initializeDatabase() {
        // Initialize local storage with sample data if empty
        if (!localStorage.getItem('meetpoint_users')) {
            const sampleUsers = [
                {
                    id: 1,
                    username: 'demo_user',
                    email: 'demo@meetpoint.com',
                    password: 'demo123',
                    avatar: 'resources/avatars/avatar1.jpg',
                    location: [52.2297, 21.0122], // Warsaw
                    friends: [2, 3],
                    online: true
                },
                {
                    id: 2,
                    username: 'gym_partner',
                    email: 'gym@meetpoint.com',
                    password: 'gym123',
                    avatar: 'resources/avatars/avatar2.jpg',
                    location: [52.2300, 21.0130],
                    friends: [1],
                    online: false
                },
                {
                    id: 3,
                    username: 'study_buddy',
                    email: 'study@meetpoint.com',
                    password: 'study123',
                    avatar: 'resources/avatars/avatar3.jpg',
                    location: [52.2290, 21.0115],
                    friends: [1],
                    online: true
                }
            ];
            localStorage.setItem('meetpoint_users', JSON.stringify(sampleUsers));
        }

        if (!localStorage.getItem('meetpoint_events')) {
            const sampleEvents = [
                {
                    id: 1,
                    creatorId: 1,
                    title: 'Morning Gym Session',
                    description: 'Looking for a gym partner for morning workouts. All levels welcome!',
                    category: 'sports',
                    location: [52.2297, 21.0122],
                    address: 'Fitness Center, Warsaw',
                    datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                    maxParticipants: 4,
                    participants: [1, 2],
                    status: 'active'
                },
                {
                    id: 2,
                    creatorId: 2,
                    title: 'Coffee & Code',
                    description: 'Casual programming study group. Bring your laptop!',
                    category: 'study',
                    location: [52.2305, 21.0100],
                    address: 'Café Nero, Warsaw',
                    datetime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
                    maxParticipants: 6,
                    participants: [2, 3],
                    status: 'active'
                },
                {
                    id: 3,
                    creatorId: 3,
                    title: 'Weekend Board Games',
                    description: 'Board game night at my place. Drinks and snacks provided!',
                    category: 'social',
                    location: [52.2285, 21.0140],
                    address: 'Nowy Świat 15, Warsaw',
                    datetime: new Date(Date.now() + 259200000).toISOString(), // This weekend
                    maxParticipants: 8,
                    participants: [3, 1],
                    status: 'active'
                }
            ];
            localStorage.setItem('meetpoint_events', JSON.stringify(sampleEvents));
        }

        if (!localStorage.getItem('meetpoint_messages')) {
            const sampleMessages = [
                {
                    id: 1,
                    senderId: 1,
                    receiverId: 2,
                    content: 'Hey! Are you still up for the gym tomorrow?',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    eventId: null
                },
                {
                    id: 2,
                    senderId: 2,
                    receiverId: 1,
                    content: 'Yes! Looking forward to it. What time should we meet?',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    eventId: null
                }
            ];
            localStorage.setItem('meetpoint_messages', JSON.stringify(sampleMessages));
        }
    }

    loadUserData() {
        this.users = JSON.parse(localStorage.getItem('meetpoint_users') || '[]');
        this.events = JSON.parse(localStorage.getItem('meetpoint_events') || '[]');
        this.messages = JSON.parse(localStorage.getItem('meetpoint_messages') || '[]');
        
        // Load current user from session
        const userId = sessionStorage.getItem('currentUserId');
        if (userId) {
            this.currentUser = this.users.find(u => u.id === parseInt(userId));
        }
    }

    saveData() {
        localStorage.setItem('meetpoint_users', JSON.stringify(this.users));
        localStorage.setItem('meetpoint_events', JSON.stringify(this.events));
        localStorage.setItem('meetpoint_messages', JSON.stringify(this.messages));
    }

    // Authentication
    register(username, email, password) {
        if (this.users.find(u => u.username === username || u.email === email)) {
            return { success: false, message: 'User already exists' };
        }

        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            avatar: `resources/avatars/avatar${Math.floor(Math.random() * 10) + 1}.jpg`,
            location: [52.2297, 21.0122], // Default to Warsaw
            friends: [],
            online: true
        };

        this.users.push(newUser);
        this.saveData();
        return { success: true, user: newUser };
    }

    login(username, password) {
        const user = this.users.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );

        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('currentUserId', user.id);
            user.online = true;
            this.saveData();
            return { success: true, user };
        }

        return { success: false, message: 'Invalid credentials' };
    }

    logout() {
        if (this.currentUser) {
            this.currentUser.online = false;
            this.saveData();
        }
        this.currentUser = null;
        sessionStorage.removeItem('currentUserId');
    }

    // Event Management
    createEvent(title, description, category, location, address, datetime, maxParticipants) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };

        const newEvent = {
            id: Date.now(),
            creatorId: this.currentUser.id,
            title,
            description,
            category,
            location,
            address,
            datetime: new Date(datetime).toISOString(),
            maxParticipants,
            participants: [this.currentUser.id],
            status: 'active'
        };

        this.events.push(newEvent);
        this.saveData();
        this.addEventMarker(newEvent);
        return { success: true, event: newEvent };
    }

    joinEvent(eventId) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };

        const event = this.events.find(e => e.id === eventId);
        if (!event) return { success: false, message: 'Event not found' };

        if (event.participants.includes(this.currentUser.id)) {
            return { success: false, message: 'Already joined' };
        }

        if (event.participants.length >= event.maxParticipants) {
            return { success: false, message: 'Event is full' };
        }

        event.participants.push(this.currentUser.id);
        this.saveData();
        return { success: true };
    }

    leaveEvent(eventId) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };

        const event = this.events.find(e => e.id === eventId);
        if (!event) return { success: false, message: 'Event not found' };

        const index = event.participants.indexOf(this.currentUser.id);
        if (index === -1) {
            return { success: false, message: 'Not participating' };
        }

        event.participants.splice(index, 1);
        this.saveData();
        return { success: true };
    }

    // Friends System
    addFriend(username) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };

        const friend = this.users.find(u => u.username === username);
        if (!friend) return { success: false, message: 'User not found' };

        if (friend.id === this.currentUser.id) {
            return { success: false, message: 'Cannot add yourself' };
        }

        if (this.currentUser.friends.includes(friend.id)) {
            return { success: false, message: 'Already friends' };
        }

        this.currentUser.friends.push(friend.id);
        this.saveData();
        return { success: true, friend };
    }

    removeFriend(userId) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };

        const index = this.currentUser.friends.indexOf(userId);
        if (index === -1) {
            return { success: false, message: 'Not friends' };
        }

        this.currentUser.friends.splice(index, 1);
        this.saveData();
        return { success: true };
    }

    getFriends() {
        if (!this.currentUser) return [];
        return this.users.filter(u => this.currentUser.friends.includes(u.id));
    }

    // Messaging
    sendMessage(receiverId, content, eventId = null) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };

        const newMessage = {
            id: Date.now(),
            senderId: this.currentUser.id,
            receiverId,
            content,
            timestamp: new Date().toISOString(),
            eventId
        };

        this.messages.push(newMessage);
        this.saveData();
        return { success: true, message: newMessage };
    }

    getMessages(userId) {
        if (!this.currentUser) return [];

        return this.messages.filter(m => 
            (m.senderId === this.currentUser.id && m.receiverId === userId) ||
            (m.senderId === userId && m.receiverId === this.currentUser.id)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // Map Integration
    initializeMap(containerId, center = [52.2297, 21.0122], zoom = 13) {
        this.map = L.map(containerId).setView(center, zoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add event markers
        this.events.forEach(event => this.addEventMarker(event));
        
        // Add user location marker if logged in
        if (this.currentUser) {
            this.addUserMarker(this.currentUser);
        }

        return this.map;
    }

    addEventMarker(event) {
        if (!this.map) return;

        const creator = this.users.find(u => u.id === event.creatorId);
        const categoryIcons = {
            sports: '🏃',
            study: '📚',
            social: '🎉',
            food: '🍕',
            travel: '✈️',
            music: '🎵',
            art: '🎨',
            tech: '💻'
        };

        const icon = categoryIcons[event.category] || '📍';
        const marker = L.marker(event.location)
            .addTo(this.map)
            .bindPopup(`
                <div class="p-2">
                    <h3 class="font-bold text-lg">${event.title}</h3>
                    <p class="text-sm text-gray-600 mb-2">${event.description}</p>
                    <div class="flex items-center gap-2 mb-2">
                        <span>${icon}</span>
                        <span class="text-xs bg-blue-100 px-2 py-1 rounded">${event.category}</span>
                    </div>
                    <p class="text-xs text-gray-500">📍 ${event.address}</p>
                    <p class="text-xs text-gray-500">📅 ${new Date(event.datetime).toLocaleDateString()}</p>
                    <p class="text-xs text-gray-500">👥 ${event.participants.length}/${event.maxParticipants} participants</p>
                    <p class="text-xs text-gray-500">Created by: ${creator ? creator.username : 'Unknown'}</p>
                    <button onclick="app.joinEvent(${event.id})" class="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                        Join Event
                    </button>
                </div>
            `);

        this.markers.push({ id: event.id, type: 'event', marker });
    }

    addUserMarker(user) {
        if (!this.map) return;

        const marker = L.marker(user.location)
            .addTo(this.map)
            .bindPopup(`
                <div class="p-2">
                    <h3 class="font-bold">${user.username}</h3>
                    <p class="text-xs text-gray-500">${user.online ? '🟢 Online' : '🔴 Offline'}</p>
                </div>
            `);

        this.markers.push({ id: user.id, type: 'user', marker });
    }

    clearMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.markers = [];
    }

    // Utility Functions
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getEventsByCategory(category) {
        return this.events.filter(e => e.category === category);
    }

    getEventsNearLocation(location, radius = 5) {
        // Simple distance calculation (km)
        return this.events.filter(e => {
            const distance = this.calculateDistance(location, e.location);
            return distance <= radius;
        });
    }

    calculateDistance(loc1, loc2) {
        const R = 6371; // Earth's radius in km
        const dLat = (loc2[0] - loc1[0]) * Math.PI / 180;
        const dLon = (loc2[1] - loc1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(loc1[0] * Math.PI / 180) * Math.cos(loc2[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Search functionality
    searchEvents(query) {
        return this.events.filter(e => 
            e.title.toLowerCase().includes(query.toLowerCase()) ||
            e.description.toLowerCase().includes(query.toLowerCase()) ||
            this.getCategoryName(e.category).toLowerCase().includes(query.toLowerCase())
        );
    }

    getCategoryName(category) {
        const categories = {
            sports: 'Sports & Fitness',
            study: 'Study & Learning',
            social: 'Social & Entertainment',
            food: 'Food & Dining',
            travel: 'Travel & Adventure',
            music: 'Music & Arts',
            art: 'Arts & Culture',
            tech: 'Technology'
        };
        return categories[category] || category;
    }
}

// Initialize the application
const app = new MeetPoint();

// Global functions for HTML onclick handlers
window.app = app;