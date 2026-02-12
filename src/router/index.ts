import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import ProfileSetup from '../views/ProfileSetup.vue';
import RateTeammates from '../views/RateTeammates.vue';
import Login from '../views/Login.vue';

// Admin Views (Loaded lazily)
const AdminGameList = () => import('../views/admin/GameList.vue');
const AdminTeamBuilder = () => import('../views/admin/TeamBuilder.vue');

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login,
        },
        {
            path: '/',
            redirect: '/profile',
        },
        {
            path: '/profile',
            name: 'profile',
            component: ProfileSetup,
            meta: { requiresAuth: true },
        },
        {
            path: '/rate',
            name: 'rate',
            component: RateTeammates,
            meta: { requiresAuth: true },
        },
        // Admin Routes
        {
            path: '/admin/games',
            name: 'admin-games',
            component: AdminGameList,
            meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
            path: '/admin/games/:id/builder',
            name: 'admin-team-builder',
            component: AdminTeamBuilder,
            meta: { requiresAuth: true, requiresAdmin: true },
        },
    ],
});

router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore();

    // Check auth status if not already checked (e.g. page refresh)
    if (!authStore.isAuthenticated && authStore.token) {
        await authStore.checkAuth();
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' });
    } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: 'profile' }); // Redirect to home if already logged in
    } else if (to.meta.requiresAdmin) {
        // Init Check if user is admin
        if (!authStore.isAdmin) {
            next({ name: 'profile' }); // Redirect to profile if not admin
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router;
