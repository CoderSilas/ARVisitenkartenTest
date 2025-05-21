/*!
 * AR Video Player addon for encantar.js
 * @version 1.1.0
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

AFRAME.registerPrimitive('ar-video-player', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {

    defaultComponents: {
        'ar-video-player': { },

        geometry: {
            primitive: 'plane',
            width: 2,
            height: 1.125,
        },

        material: {
            shader: 'flat',
            color: 'white',
            side: 'double',
            transparent: true,
        },
    },

    mappings: {
        width: 'geometry.width',
        height: 'geometry.height',
        src: 'ar-video-player.src',
        autoplay: 'ar-video-player.autoplay',
    },

}));

const VIDEO_EVENTS = [ 'play', 'pause', 'ended' ];

AFRAME.registerComponent('ar-video-player', {

    dependencies: [ 'material' ],

    schema: {
        src: { type: 'selector', default: '' },
        autoplay: { type: 'boolean', default: false },
    },

    init()
    {
        this._actionTable = {
            play:        video => video.play(),
            pause:       video => video.pause(),
            toggle:      video => video.paused ? video.play() : video.pause(),
            stop:        video => (video.pause(), video.currentTime = 0),
            rewind:      video => video.currentTime = 0,
            mute:        video => video.muted = true,
            unmute:      video => video.muted = false,
            toggleAudio: video => video.muted = !video.muted,
        };

        this._eventHandler = {};
        for(let event of VIDEO_EVENTS)
            this._eventHandler[event] = () => this.el.emit('video' + event, null, false);

        this._defaultSrc = this.data.src;

        this.el.addEventListener('loaded', () => {
            const video = this._getVideoElement();
            if(!video)
                console.error('Missing <video> element');
            else if(this.data.autoplay && !video.muted)
                console.warn(`autoplay is set on <ar-video-player>, but the <video> isn't muted. Autoplay may be blocked`);
        });

        const scene = this.el.sceneEl;
        this._onTargetFound = this._onTargetFound.bind(this);
        this._onTargetLost = this._onTargetLost.bind(this);
        scene.addEventListener('artargetfound', this._onTargetFound);
        scene.addEventListener('artargetlost', this._onTargetLost);
    },

    remove()
    {
        const data = this.data;
        const scene = this.el.sceneEl;

        if(data.src instanceof HTMLVideoElement) {
            const video = data.src;
            for(let event of VIDEO_EVENTS)
                video.removeEventListener(event, this._eventHandler[event]);
        }

        scene.removeEventListener('artargetlost', this._onTargetLost);
        scene.removeEventListener('artargetfound', this._onTargetFound);
    },

    update(oldData)
    {
        const data = this.data;

        if(data.src !== oldData.src) {

            if(oldData.src instanceof HTMLVideoElement) {
                const video = oldData.src;
                for(let event of VIDEO_EVENTS)
                    video.removeEventListener(event, this._eventHandler[event]);
            }

            if(data.src instanceof HTMLVideoElement) {
                const video = data.src;
                for(let event of VIDEO_EVENTS)
                    video.addEventListener(event, this._eventHandler[event]);

                this.el.setAttribute('material', 'src', data.src);
            }

        }
    },

    invoke(action)
    {
        const video = this._getVideoElement();
        if(!video)
            return;

        if(Object.prototype.hasOwnProperty.call(this._actionTable, action))
            this._actionTable[action].call(this, video);
    },

    _getVideoElement()
    {
        const data = this.data;
        return (data.src instanceof HTMLVideoElement) ? data.src : null;
    },

    _onTargetLost(event)
    {
        const referenceImageName = event.detail.referenceImage.name;
        if(!this._matchesReferenceImageName(referenceImageName))
            return;

        const video = this._getVideoElement();
        if(!video)
            return;

        video.pause();

        const isMuted = video.muted;
        for(let otherVideo of this._allVideos())
            otherVideo.muted = isMuted;
    },

    _onTargetFound(event)
    {
        const referenceImageName = event.detail.referenceImage.name;
        if(!this._matchesReferenceImageName(referenceImageName))
            return;

        const source = this._findMatchingSourceElement(referenceImageName);
        if(source) {
            const video = source.src;
            if(video.currentTime === 0) // handle quirk
                video.load();

            this.el.setAttribute('ar-video-player', { src: video });
        }
        else
            this.el.setAttribute('ar-video-player', { src: this._defaultSrc });

        this._handleAutoplay();

    },

    _matchesReferenceImageName(referenceImageName)
    {
        const arRoot = this._findARRoot();
        if(!arRoot)
            return false;

        const arRootReferenceImageName = arRoot.referenceImage || '';
        return (arRootReferenceImageName === '' || arRootReferenceImageName === referenceImageName);
    },

    _findMatchingSourceElement(referenceImageName)
    {
        for(const child of this.el.children) {
            const source = child.getAttribute('ar-video-player-source');

            if(source && source.referenceImage === referenceImageName && source.src instanceof HTMLVideoElement)
                return source;
        }

        return null;
    },

    _allVideos()
    {
        const videos = [];

        if(this._defaultSrc instanceof HTMLVideoElement)
            videos.push(this._defaultSrc);

        for(const child of this.el.children) {
            const source = child.getAttribute('ar-video-player-source');

            if(source && source.src instanceof HTMLVideoElement)
                videos.push(source.src);
        }

        return videos;
    },

    _handleAutoplay()
    {
        if(!this.data.autoplay)
            return;

        const video = this._getVideoElement();
        if(!video)
            return;

        const promise = video.play();
        if(promise === undefined)
            return;

        promise.catch(err => console.warn(err));
    },

    _findARRoot()
    {
        for(let el = this.el; el && el !== el.sceneEl; el = el.parentEl) {
            const arRoot = el.getAttribute('ar-root');

            if(arRoot)
                return arRoot;
        }

        return null;
    },

});

AFRAME.registerComponent('ar-video-control', {

    dependencies: [ 'ar-clickable' ],

    schema: {
        'action': { default: '', oneOf: [ '', 'play', 'pause', 'toggle', 'stop', 'rewind', 'mute', 'unmute', 'toggleAudio' ] },
    },

    init()
    {
        this._onclick = this._onclick.bind(this);
        this.el.addEventListener('click', this._onclick);
    },

    remove()
    {
        this.el.removeEventListener('click', this._onclick);
    },

    _findVideoPlayer()
    {
        for(let el = this.el; el && el !== el.sceneEl; el = el.parentEl) {
            const videoPlayer = el.components['ar-video-player'];

            if(videoPlayer)
                return videoPlayer;
        }

        return null;
    },

    _onclick()
    {
        const videoPlayer = this._findVideoPlayer();

        if(videoPlayer)
            videoPlayer.invoke(this.data.action);
    },

});

AFRAME.registerComponent('ar-video-player-source', {

    schema: {
        src: { type: 'selector', default: '' },
        referenceImage: { type: 'string', default: '' },
    },

    update(oldData)
    {
        const data = this.data;

        if(data.src !== oldData.src)
            this._preload();
    },

    _preload()
    {
        const data = this.data;

        if(data.src instanceof HTMLVideoElement) {
            const video = data.src;

            video.setAttribute('playsinline', '');
            video.setAttribute('preload', 'auto');
            video.load();

            // handle quirk
            if(video.loop || video.dataset.loop) {
                video.removeAttribute('loop');
                video.setAttribute('data-loop', 'loop');
                video.onended = () => (video.load(), video.play());
            }
            else
                video.onended = () => video.load();
        }
    },

});

AFRAME.registerPrimitive('ar-video-player-source', {

    defaultComponents: {
        'ar-video-player-source': { },
    },

    mappings: {
        src: 'ar-video-player-source.src',
        'reference-image': 'ar-video-player-source.referenceImage',
    },

});

for(let event of VIDEO_EVENTS)
    AFRAME.registerComponent('ar-onvideo' + event, generateDeclarativeEventListener(event));

function generateDeclarativeEventListener(eventName)
{
    const styleParser = AFRAME.utils.styleParser;

    return {

        multiple: true,

        schema: {
            default: '',
            parse: value => styleParser.parse(value),
            stringify: value => styleParser.stringify(value),
        },

        init()
        {
            this._handleEvent = this._handleEvent.bind(this);

            this.el.sceneEl.addEventListener('loaded', () => {

                const videoPlayer = this._findVideoPlayer();

                if(!videoPlayer) {
                    console.error(`Can't find the video player!`);
                    return;
                }

                videoPlayer.el.addEventListener('video' + eventName, this._handleEvent);

            });
        },

        remove()
        {
            const videoPlayer = this._findVideoPlayer();

            if(videoPlayer)
                videoPlayer.el.removeEventListener('video' + eventName, this._handleEvent);
        },

        _findVideoPlayer()
        {
            for(let el = this.el; el && el !== el.sceneEl; el = el.parentEl) {
                const videoPlayer = el.components['ar-video-player'];

                if(videoPlayer)
                    return videoPlayer;
            }

            return null;
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
