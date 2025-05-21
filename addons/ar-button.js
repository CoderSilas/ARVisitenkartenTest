/*!
 * AR Button addon for encantar.js
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

const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAEuElEQVR4Xu2Yy0pbYRDHv2iSCl5AwQtuu2rBhWvB+gjipj6AIBUFQQT7BBWkILQogg/QbsRHsIJrF0JddVu8gIIX0CSazqQ9Eo7xQomQc/6/AwPJSfwyM//fmYuZwCWdgYx09AQfngLgneXovdmI2WuzPDlLRAYK5uUvsy2z72Y/HvL6IQD67Q8+mk0nIlycfCoDX+0Ln8x+x79YCwAX/7PZuH95Y2MjDA0Nha6urtDc3PzUD/F5A2Tg5uYmnJychJ2dnTA2NhZ59M1ezMUhiANwJ/7CwkKYnZ0NPT09DRASLvxvBo6OjsLy8nJYXFz0I+5BEAfgi5d9F9+to6Pjf3+Xv2ugDJydnVUA+AeBt4OZyL1qAHzg2/IPDg4OePIbSMB6uOKVoK+vLzpqxF5UBsNqAFbs/Qfv+aOjo/X4Tc5osAxsbm5GM8GquTYVB+Cn3XhzeHgYuru7G8x13KlHBo6Pj0Nvb68ftW/2Ng7Atd3IF4tFpv16ZLsBz/DtIJfLuWf+f4JXcQDKfuP29rYBXcelemWgqakpOqrS/qtngJoAODWRAUe9ZHjZc1xk/59NZNW/9mwAyuVy8HbgxpXcDHjJd8tk/j7rzwLAxS8UCqFUKiU3cjy/y0A2mw35fL4CwbMAcPF58tNFkFcBh+BJAFz4q6urdEVPNJUMtLS0RFvA3fx3bwh08Xn600mMVwGH4N9Vewu4vLxkFUyn/pXy39ra+jgA5+fnKQ2fsDwD7e3tAKCMAgAoq08FEFcfAACAFiDOAAAAAFuAMgNUAGX1GQLF1QcAAKAFiDMAAADAFqDMABVAWX2GQHH1AQAAaAHiDAAAALAFKDNABVBWnyFQXH0AAABagDgDAAAAbAHKDFABlNVnCBRXHwAAgBYgzgAAAABbgDIDVABl9RkCxdUHAACgBYgzAAAAwBagzAAVQFl9hkBx9QEAAGgB4gwAAACwBSgzQAVQVp8hUFx9AAAAWoA4AwAAAGwBygxQAZTVZwgUVx8AAIAWIM4AAAAAW4AyA1QAZfUZAsXVBwAAoAWIMwAAAMAWoMwAFUBZfYZAcfUBAABoAeIMAAAAsAUoM0AFUFafIVBcfQAAAFqAOAMAAABsAcoMUAGU1WcIFFcfAACAFiDOAAAAAFuAMgNUAGX1GQLF1QcAAKAFiDMAAADAFqDMABVAWX2GQHH1AQAAaAHiDAAAALAFKDNABVBWnyFQXH0AAABagDgDAAAAbAHKDDxWAa4tMfmLi4tQLpeVc5Ta2DOZTGhra/P4Cmav/EWmKtqf9vrN6elpyGazqU2CcmClUil0dnZ6CvbN3sYBWLEbH7a3t8Pg4KBynlIb++7ubhgeHvb4Vs2m4gC8sxtbfpMqkD4Gqp5+D27E7EccAH//xWx6aWkpTE5OBu8ZXMnPgM90a2trYX5+3oP5ajYTRRVXuN8++Gw27hBMTEwwDyRcf3/y19fXI/G/WThzZr8fAsDv30Hgb3wmGBgYCLlcju0gITB45S4Wi2Fvby/q+e75PfFrtYAoRIfgo7eDhMSMm49nwMv+p+on/7EKUH2UD4bvzUbMXpvlyXQiMuB7/i+zLbPvZpWBr9bFlJcIPV/OSQB4udwm4uQ/j7lxn/0MMM4AAAAASUVORK5CYII=';

AFRAME.registerPrimitive('ar-button', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {

    defaultComponents: {
        'ar-button': { },

        geometry: {
            primitive: 'plane',
            width: 0.5,
            height: 0.5,
        },

        material: {
            shader: 'flat',
            color: 'white',
            side: 'double',
            transparent: true,
        },
    },

    mappings: {
        enabled: 'ar-button.enabled',
        src: 'ar-button.src',
        color: 'ar-button.color',
        'pressed-color': 'ar-button.pressedColor',
        'disabled-color': 'ar-button.disabledColor',
        width: 'geometry.width',
        height: 'geometry.height',
    },

}));

AFRAME.registerComponent('ar-button', {

    dependencies: [ 'material', 'ar-clickable' ],

    schema: {
        enabled: { type: 'boolean', default: true },
        src: { type: 'string', default: '' },
        color: { type: 'color', default: 'white' },
        pressedColor: { type: 'color', default: '#ffd855' },
        disabledColor: { type: 'color', default: 'gray' },
    },

    init()
    {
        this._onmousedown = this._onmousedown.bind(this);
        this._onmouseup = this._onmouseup.bind(this);
    },

    play()
    {
        this.el.addEventListener('mousedown', this._onmousedown);
        this.el.addEventListener('mouseup', this._onmouseup);
    },

    pause()
    {
        this.el.removeEventListener('mouseup', this._onmouseup);
        this.el.removeEventListener('mousedown', this._onmousedown);
    },

    update(oldData)
    {
        const el = this.el;
        const data = this.data;

        if(data.src === '')
            data.src = `url(${DEFAULT_IMAGE})`;

        if(data.src !== oldData.src)
            el.setAttribute('material', 'src', data.src);

        if(data.color !== oldData.color)
            el.setAttribute('material', 'color', data.color);

        if(data.enabled !== oldData.enabled) {
            el.setAttribute('material', 'color', data.enabled ? data.color : data.disabledColor);
            el.setAttribute('ar-clickable', 'enabled', data.enabled);
        }
    },

    _onmousedown()
    {
        const data = this.data;

        if(data.enabled)
            this.el.setAttribute('material', 'color', data.pressedColor);
    },

    _onmouseup()
    {
        const data = this.data;

        if(data.enabled)
            this.el.setAttribute('material', 'color', data.color);
    },

});

AFRAME.registerComponent('ar-navigation-button', {

    dependencies: [ 'ar-clickable' ],

    schema: {
        type: 'string',
        default: 'about:blank'
    },

    init()
    {
        this._onclick = this._onclick.bind(this);
    },

    play()
    {
        this.el.addEventListener('click', this._onclick);
    },

    pause()
    {
        this.el.removeEventListener('click', this._onclick);
    },

    _onclick()
    {
        location.href = this.data;
    },

});

})();
