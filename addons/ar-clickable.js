/*!
 * AR Clickable addon for encantar.js
 * @version 1.0.0
 * @author Alexandre Martins (https://encantar.dev)
 * @license LicenseRef-Proprietary
 */

/*!

*********************************************************************
*                                                                   *
*                        FOR SUPPORTERS ONLY                        *
*                                                                   *
*      THIS ADD-ON IS AVAILABLE FOR SUPPORTERS OF ENCANTAR.JS       *
*                                                                   *
*    GET YOUR LICENSE TO USE THIS ADD-ON AT https://encantar.dev    *
*                                                                   *
*********************************************************************

*/

(function() {

AFRAME.registerSystem('ar-clickable', {

    init()
    {
        this._clickables = [];
        this._state = [];
        this._tmp = [];
        this._raycaster = new THREE.Raycaster();
        //this._raycaster.layers.enableAll();

        this.el.addEventListener('loaded', this._setup.bind(this));
    },

    tick()
    {
        const ar = this.el.systems.ar;

        this._resetState();

        for(let i = 0; i < ar.pointers.length; i++)
            this._handlePointer(ar.pointers[i]);

        this._emitEvents();
    },

    register(clickable)
    {
        if(this._clickables.indexOf(clickable) < 0) {
            this._clickables.push(clickable);
            this._state.push({
                intersection: [],
                pointer: null,
                isFirstPointer: false,
                linkedPointerId: Number.NaN,
            });
        }
    },

    unregister(clickable)
    {
        let j = this._clickables.indexOf(clickable);
        if(j >= 0) {
            this._clickables.splice(j, 1);
            this._state.splice(j, 1);
        }
    },

    _handlePointer(pointer)
    {
        const ar = this.el.systems.ar;
        const intersectionDetails = this._tmp;

        if(!ar.viewer)
            return;

        const ray = ar.viewer.raycast(pointer.position);
        this._raycaster.ray = ar.utils.convertRay(ray);

        for(let i = 0; i < this._clickables.length; i++) {
            const clickable = this._clickables[i];
            const state = this._state[i];
            const entity = clickable.el;

            if(!clickable.data.enabled)
                continue;

            intersectionDetails.length = 0;
            this._raycaster.intersectObject(entity.object3D, true, intersectionDetails);

            if(intersectionDetails.length == 0)
                continue;

            if(!state.pointer || pointer.duration < state.pointer.duration) {
                state.pointer = pointer;
                state.isFirstPointer = Number.isNaN(state.linkedPointerId);
                state.intersection.length = 0;

                if(pointer.phase == 'began')
                    state.linkedPointerId = pointer.id;
            }

            if(pointer.id == state.linkedPointerId)
                state.intersection.push.apply(state.intersection, [].concat(intersectionDetails));
        }
    },

    _emitEvents()
    {
        for(let i = 0; i < this._clickables.length; i++) {
            const clickable = this._clickables[i];
            const state = this._state[i];
            const pointer = state.pointer;
            const entity = clickable.el;
            const intersection = state.intersection.length > 0 ? state.intersection[0] : null; // closest intersection

            if(!pointer) {
                if(!Number.isNaN(state.linkedPointerId)) {
                    if(!this._pointerIdExists(state.linkedPointerId)) {
                        state.linkedPointerId = Number.NaN;
                        entity.emit('mouseup', { intersection, pointer }, false);
                    }
                }
            }
            else if(pointer.phase == 'ended') {
                if(pointer.id == state.linkedPointerId)
                    entity.emit('click', { intersection, pointer }, false);
            }
            else if(pointer.phase == 'began') {
                if(pointer.id == state.linkedPointerId && state.isFirstPointer)
                    entity.emit('mousedown', { intersection, pointer }, false);
            }
        }
    },

    _resetState()
    {
        for(let i = 0; i < this._state.length; i++) {
            const state = this._state[i];
            
            state.pointer = null;
            state.isFirstPointer = false;
            state.intersection.length = 0;
        }
    },

    _pointerIdExists(pointerId)
    {
        const ar = this.el.systems.ar;
        return ar.pointers.some(pointer => pointer.id == pointerId);
    },

    _setup()
    {
        this._validate();
        this._setupCamera();
    },

    _setupCamera()
    {
        const scene = this.el;
        const camera = scene.querySelector('[ar-camera]');

        if(!camera) {
            console.error('Missing ar-camera');
            return;
        }

        this._raycaster.camera = camera.getObject3D('camera');
    },

    _validate()
    {
        const scene = this.el;
        const pointerTracker = scene.querySelector('[ar-pointer-tracker]');

        if(!pointerTracker)
            console.error('Missing ar-pointer-tracker');
    },

});

AFRAME.registerComponent('ar-clickable', {

    schema: {

        /** Whether or not the entity will receive events */
        enabled: { type: 'boolean', default: true },

    },

    play()
    {
        this.system.register(this);
    },

    pause()
    {
        this.system.unregister(this);
    },

});

for(let eventName of ['click', 'mousedown', 'mouseup'])
    AFRAME.registerComponent('ar-on' + eventName, generateDeclarativeEventListener(eventName));

function generateDeclarativeEventListener(eventName)
{
    const styleParser = AFRAME.utils.styleParser;

    return {

        dependencies: [ 'ar-clickable' ],

        multiple: true,

        schema: {
            default: '',
            parse: value => styleParser.parse(value),
            stringify: value => styleParser.stringify(value),
        },

        init()
        {
            this._handleEvent = this._handleEvent.bind(this);
        },

        play()
        {
            this.el.addEventListener(eventName, this._handleEvent);
        },

        pause()
        {
            this.el.removeEventListener(eventName, this._handleEvent);
        },

        _handleEvent()
        {
            const el = this.el;
            const data = this.data;
            const target = data._target ? el.sceneEl.querySelector(data._target) : el; // similar to event-set

            // validate
            if(!target || typeof data !== 'object')
                return;

            const delay = data._delay ? parseFloat(data._delay) : Number.NaN;
            if(Number.isNaN(delay))
                this._setAttributes(data, target);
            else
                setTimeout(() => this._setAttributes(data, target), delay);
        },

        _setAttributes(data, target)
        {
            for(let key in data) {
                if(key != '_target' && key != '_delay')
                    AFRAME.utils.entity.setComponentProperty(target, this._undoCamelCase(key), data[key]);
            }
        },

        // A-Frame's style parser converts ar-component names to camelCase
        // (e.g., ar-clickable becomes arClickable)
        _undoCamelCase(key)
        {
            if(!(key.startsWith('ar') && key.length > 2 && key[2] == key[2].toUpperCase()))
                return key;

            const j = key.indexOf('.');
            const suffix = j >= 0 ? key.substring(j) : '';
            const component = j >= 0 ? key.substring(0, j) : key;
            const fixedComponent = component.replace(/([a-z])([A-Z])/g, (_, _1, _2) => _1 + '-' + _2.toLowerCase());

            return fixedComponent + suffix;
        },

    };
}

})();
