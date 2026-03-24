import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import ProfileSetup from '../views/ProfileSetup.vue';
import RateTeammates from '../views/RateTeammates.vue';
import Login from '../views/Login.vue';
import Unauthorized from '../views/Unauthorized.vue';

import AdminGameList from '../views/admin/GameList.vue';
import AdminTeamBuilder from '../views/admin/TeamBuilder.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login,
        },
        {
            path: '/unauthorized',
            name: 'unauthorized',
            component: Unauthorized,
        },
        // Workspace-scoped routes
        {
            path: '/:workspaceId/profile',
            name: 'profile',
            component: ProfileSetup,
            meta: { requiresAuth: true },
        },
        {
            path: '/:workspaceId/rate',
            name: 'rate',
            component: RateTeammates,
            meta: { requiresAuth: true },
        },
        // Admin routes
        {
            path: '/:workspaceId/admin/games',
            name: 'admin-games',
            component: AdminGameList,
            meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
            path: '/:workspaceId/admin/games/:id/builder',
            name: 'admin-team-builder',
            component: AdminTeamBuilder,
            meta: { requiresAuth: true, requiresAdmin: true },
        },
        // Fallback: redirect root to login (guard will forward to workspace once authed)
        {
            path: '/',
            redirect: () => ({ name: 'login' }),
        },
    ],
});

router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore();

    // Rehydrate auth state on hard page refresh
    if (!authStore.isAuthenticated && authStore.token) {
        await authStore.checkAuth();
    }

    // --- Public routes ---
    if (!to.meta.requiresAuth) {
        if (to.name === 'login' && authStore.isAuthenticated) {
            const workspaceId = authStore.currentWorkspaceId;
            if (workspaceId) {
                return next({ name: 'profile', params: { workspaceId } });
            }
        }
        return next();
    }

    // --- Requires auth ---
    if (!authStore.isAuthenticated) {
        return next({ name: 'login' });
    }

    // --- Validate tenant membership ---
    const workspaceId = to.params.workspaceId as string;
    const userWorkspaces: any[] = authStore.user?.workspaces ?? [];
    const hasAccess = userWorkspaces.some((ws) => ws.id === workspaceId);

    if (!hasAccess) {
        // Redirect to the user's first valid workspace on the same route type,
        // falling back to profile to avoid needing extra params (e.g. :id).
        const firstWorkspace = userWorkspaces[0];
        if (firstWorkspace) {
            return next({ name: 'profile', params: { workspaceId: firstWorkspace.id } });
        }
        return next({ name: 'unauthorized' });
    }

    // Sync store if the URL workspace differs (e.g. direct link or back-button navigation)
    if (authStore.currentWorkspaceId !== workspaceId) {
        authStore.setWorkspace(workspaceId);
    }

    // --- Admin guard ---
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
        return next({ name: 'profile', params: { workspaceId } });
    }

    return next();
});

export default router;
