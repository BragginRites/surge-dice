export class SurgePool {
    constructor() {
        this._controlPoints = 0;
        this._chaosPoints = 0;
        this.socket = null; // Will be initialized with socketlib instance
        this.initSocket();
    }

    static get SOCKET_EVENT_NAME() {
        return 'module.surge-dice';
    }

    initSocket() {
        // Placeholder for socketlib registration and handlers
        // This will be more fully implemented in init.js or a dedicated socket handling file
    }

    get controlPoints() {
        return this._controlPoints;
    }

    get chaosPoints() {
        return this._chaosPoints;
    }

    /**
     * Updates the pool points and notifies clients.
     * @param {number} control - The new number of control points.
     * @param {number} chaos - The new number of chaos points.
     * @param {boolean} [fromSocket=false] - Whether this update came from a socket event.
     */
    updatePoints(control, chaos, fromSocket = false) {
        this._controlPoints = Math.max(0, control);
        this._chaosPoints = Math.max(0, chaos);

        // Notify UI to re-render (details to be added)
        Hooks.callAll('surgePoolChanged', this);

        if (!fromSocket && this.socket) {
            this.socket.executeForEveryone('updatePoints', { control: this._controlPoints, chaos: this._chaosPoints });
        }
    }

    /**
     * Sets the initial points, usually after the first surge die roll of a session.
     * @param {number} control - Initial control points.
     * @param {number} chaos - Initial chaos points.
     */
    setInitialPoints(control, chaos) {
        // Potentially only allow GM to do this, or via a specific "session start" mechanism
        this.updatePoints(control, chaos);
    }

    /**
     * Spends a control point.
     * Results in -1 Control, +1 Chaos.
     * @returns {boolean} True if a point was successfully spent, false otherwise.
     */
    spendControlPoint() {
        if (this._controlPoints > 0) {
            this.updatePoints(this._controlPoints - 1, this._chaosPoints + 1);
            return true;
        }
        return false;
    }

    /**
     * Spends a chaos point.
     * Results in -1 Chaos, +1 Control.
     * @returns {boolean} True if a point was successfully spent, false otherwise.
     */
    spendChaosPoint() {
        if (this._chaosPoints > 0) {
            this.updatePoints(this._controlPoints + 1, this._chaosPoints - 1);
            return true;
        }
        return false;
    }

    // Called by socketlib when other clients update points
    _handleSocketUpdate(data) {
        if (data && typeof data.control === 'number' && typeof data.chaos === 'number') {
            this.updatePoints(data.control, data.chaos, true);
        }
    }
}
