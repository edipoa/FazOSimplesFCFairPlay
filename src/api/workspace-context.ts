/**
 * Shared workspace context — no Vue/Pinia/Axios/Router deps.
 * Acts as the single source of truth for the active workspace ID
 * so that axios.ts can read it without creating circular dependencies.
 *
 * The auth store writes to this context; axios reads from it.
 */
let _workspaceId: string | null = localStorage.getItem('fairplay_workspaceId');

export const workspaceContext = {
    get id(): string | null {
        return _workspaceId;
    },
    set(id: string | null) {
        _workspaceId = id;
        if (id) {
            localStorage.setItem('fairplay_workspaceId', id);
        } else {
            localStorage.removeItem('fairplay_workspaceId');
        }
    },
};
