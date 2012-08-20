/*global define*/
define([
        '../ThirdParty/when',
        '../Core/loadImage',
        '../Core/DeveloperError',
        '../Core/createGuid',
        '../Core/clone',
        '../Core/Color',
        '../Core/combine',
        '../Core/defaultValue',
        '../Core/destroyObject',
        '../Core/Matrix2',
        '../Core/Matrix3',
        '../Core/Matrix4',
        '../Renderer/Texture',
        '../Renderer/CubeMap',
        '../Shaders/Materials/AsphaltMaterial',
        '../Shaders/Materials/BlobMaterial',
        '../Shaders/Materials/BrickMaterial',
        '../Shaders/Materials/BumpMapMaterial',
        '../Shaders/Materials/CementMaterial',
        '../Shaders/Materials/CheckerboardMaterial',
        '../Shaders/Materials/DotMaterial',
        '../Shaders/Materials/FacetMaterial',
        '../Shaders/Materials/FresnelMaterial',
        '../Shaders/Materials/GrassMaterial',
        '../Shaders/Materials/NormalMapMaterial',
        '../Shaders/Materials/ReflectionMaterial',
        '../Shaders/Materials/RefractionMaterial',
        '../Shaders/Materials/StripeMaterial',
        '../Shaders/Materials/TieDyeMaterial',
        '../Shaders/Materials/WoodMaterial'
    ], function(
        when,
        loadImage,
        DeveloperError,
        createGuid,
        clone,
        Color,
        combine,
        defaultValue,
        destroyObject,
        Matrix2,
        Matrix3,
        Matrix4,
        Texture,
        CubeMap,
        AsphaltMaterial,
        BlobMaterial,
        BrickMaterial,
        BumpMapMaterial,
        CementMaterial,
        CheckerboardMaterial,
        DotMaterial,
        FacetMaterial,
        FresnelMaterial,
        GrassMaterial,
        NormalMapMaterial,
        ReflectionMaterial,
        RefractionMaterial,
        StripeMaterial,
        TieDyeMaterial,
        WoodMaterial) {
    "use strict";

    /**
     * A Material defines surface appearance through a combination of diffuse, specular,
     * normal, emission, and alpha components. These values are specified using a
     * JSON schema called Fabric which gets parsed and assembled into glsl shader code
     * behind-the-scenes. Check out the <a href='https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric'>wiki page</a>
     * for more details on Fabric.
     * <br /><br />
     * <style type="text/css">
     *  #materialDescriptions code {
     *      font-weight: normal;
     *      font-family: Consolas, 'Lucida Console', Monaco, monospace;
     *      color: #A35A00;
     *  }
     *  #materialDescriptions ul, #materialDescriptions ul ul {
     *      list-style-type: none;
     *  }
     *  #materialDescriptions ul ul {
     *      margin-bottom: 10px;
     *  }
     *  #materialDescriptions ul ul li {
     *      font-weight: normal;
     *      color: #000000;
     *      text-indent: -2em;
     *      margin-left: 2em;
     *  }
     *  #materialDescriptions ul li {
     *      font-weight: bold;
     *      color: #0053CF;
     *  }
     * </style>
     *
     * Base material types and their uniforms:
     * <div id='materialDescriptions'>
     * <ul>
     *  <li>Color</li>
     *  <ul>
     *      <li><code>color</code>:  rgba color object.</li>
     *  </ul>
     *  <li>Image</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>DiffuseMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>AlphaMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channel</code>:  One character string containing r, g, b, or a for selecting the desired image channel. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>SpecularMap</li>
     *  <ul>
     *      <li><code>image</code>: path to image.</li>
     *      <li><code>channel</code>: One character string containing r, g, b, or a for selecting the desired image channel. </li>
     *      <li><code>repeat</code>: Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>EmissionMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>BumpMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channel</code>:  One character string containing r, g, b, or a for selecting the desired image channel. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *      <li><code>strength</code>:  Bump strength value between 0.0 and 1.0 where 0.0 is small bumps and 1.0 is large bumps.</li>
     *  </ul>
     *  <li>NormalMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *      <li><code>strength</code>:  Bump strength value between 0.0 and 1.0 where 0.0 is small bumps and 1.0 is large bumps.</li>
     *  </ul>
     *  <li>Reflection</li>
     *  <ul>
     *      <li><code>cubeMap</code>:  Object with positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ image paths. </li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels.</li>
     *  </ul>
     *  <li>Refraction</li>
     *  <ul>
     *      <li><code>cubeMap</code>:  Object with positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ image paths. </li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels.</li>
     *      <li><code>indexOfRefractionRatio</code>:  Number representing the refraction strength where 1.0 is the lowest and 0.0 is the highest.</li>
     *  </ul>
     *  <li>Fresnel</li>
     *  <ul>
     *      <li><code>reflection</code>:  Reflection Material.</li>
     *      <li><code>refraction</code>:  Refraction Material.</li>
     *  </ul>
     *  <li>Brick</li>
     *  <ul>
     *      <li><code>brickColor</code>:  rgba color object for the brick color.</li>
     *      <li><code>mortarColor</code>:  rgba color object for the mortar color.</li>
     *      <li><code>brickSize</code>:  Number between 0.0 and 1.0 where 0.0 is many small bricks and 1.0 is one large brick.</li>
     *      <li><code>brickPct</code>:  Number for the ratio of brick to mortar where 0.0 is all mortar and 1.0 is all brick.</li>
     *      <li><code>brickRoughness</code>:  Number between 0.0 and 1.0 representing how rough the brick looks.</li>
     *      <li><code>mortarRoughness</code>:  Number between 0.0 and 1.0 representing how rough the mortar looks.</li>
     *  </ul>
     *  <li>Wood</li>
     *  <ul>
     *      <li><code>lightWoodColor</code>:  rgba color object for the wood's base color.</li>
     *      <li><code>darkWoodColor</code>:  rgba color object for the color of rings in the wood.</li>
     *      <li><code>ringFrequency</code>:  Number for the frequency of rings in the wood.</li>
     *      <li><code>noiseScale</code>:  Object with x and y values specifying the noisiness of the ring patterns in both directions.</li>
     *  </ul>
     *  <li>Asphalt</li>
     *  <ul>
     *      <li><code>asphaltColor</code>:  rgba color object for the asphalt's color.</li>
     *      <li><code>bumpSize</code>:  Number for the size of the asphalt's bumps.</li>
     *      <li><code>roughness</code>:  Number that controls how rough the asphalt looks.</li>
     *  </ul>
     *  <li>Cement</li>
     *  <ul>
     *  <li><code>cementColor</code>:  rgba color object for the cement's color. </li>
     *  <li><code>grainScale</code>:  Number for the size of rock grains in the cement. </li>
     *  <li><code>roughness</code>:  Number that controls how rough the cement looks.</li>
     *  </ul>
     *  <li>Grass</li>
     *  <ul>
     *      <li><code>grassColor</code>:  rgba color object for the grass' color. </li>
     *      <li><code>dirtColor</code>:  rgba color object for the dirt's color. </li>
     *      <li><code>patchiness</code>:  Number that controls the size of the color patches in the grass.</li>
     *  </ul>
     *  <li>Stripe</li>
     *  <ul>
     *      <li><code>horizontal</code>:  Boolean that determines if the stripes are horizontal or vertical.</li>
     *      <li><code>lightColor</code>:  rgba color object for the stripe's light alternating color.</li>
     *      <li><code>darkColor</code>:  rgba color object for the stripe's dark alternating color.</li>
     *      <li><code>offset</code>:  Number that controls the stripe offset from the edge.</li>
     *      <li><code>repeat</code>:  Number that controls the total number of stripes, half light and half dark.</li>
     *  </ul>
     *  <li>Checkerboard</li>
     *  <ul>
     *      <li><code>lightColor</code>:  rgba color object for the checkerboard's light alternating color.</li>
     *      <li><code>darkColor</code>: rgba color object for the checkerboard's dark alternating color.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of columns and rows respectively.</li>
     *  </ul>
     *  <li>Dot</li>
     *  <ul>
     *      <li><code>lightColor</code>:  rgba color object for the dot color.</li>
     *      <li><code>darkColor</code>:  rgba color object for the background color.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of columns and rows of dots respectively.</li>
     *  </ul>
     *  <li>TieDye</li>
     *  <ul>
     *      <li><code>lightColor</code>:  rgba color object for the light color.</li>
     *      <li><code>darkColor</code>:  rgba color object for the dark color.</li>
     *      <li><code>frequency</code>:  Number that controls the frequency of the pattern.</li>
     *  </ul>
     *  <li>Facet</li>
     *  <ul>
     *      <li><code>lightColor</code>:  rgba color object for the light color.</li>
     *      <li><code>darkColor</code>:  rgba color object for the dark color.</li>
     *      <li><code>frequency</code>:  Number that controls the frequency of the pattern.</li>
     *  </ul>
     *  <li>Blob</li>
     *  <ul>
     *      <li><code>lightColor</code>:  rgba color object for the light color.</li>
     *      <li><code>darkColor</code>:  rgba color object for the dark color.</li>
     *      <li><code>frequency</code>:  Number that controls the frequency of the pattern.</li>
     *  </ul>
     * </ul>
     * </div>
     *
     * @alias Material
     *
     * @param {Context} description.context The context used to create textures if the material uses them.
     * @param {Boolean} [description.strict = false] Throws errors for issues that would normally be ignored, including unused uniforms or materials.
     * @param {Object} description.fabric The fabric JSON used to generate the material.
     *
     * @constructor
     *
     * @exception {DeveloperError} fabric: uniform has invalid type.
     * @exception {DeveloperError} fabric: uniforms and materials cannot share the same property.
     * @exception {DeveloperError} fabric: cannot have source and components in the same section.
     * @exception {DeveloperError} fabric: property name is not valid. It should be 'type', 'materials', 'uniforms', 'components', or 'source'.
     * @exception {DeveloperError} fabric: property name is not valid. It should be 'diffuse', 'specular', 'normal', 'emission', or 'alpha'.
     * @exception {DeveloperError} image: context is not defined.
     * @exception {DeveloperError} strict: shader source does not use string.
     * @exception {DeveloperError} strict: shader source does not use uniform.
     * @exception {DeveloperError} strict: shader source does not use material.
     *
     * @example
     * // Create a color material with fromType:
     * polygon.material = Material.fromType(context, 'Color');
     * polygon.material.uniforms.color = {
     *     red : 1.0,
     *     green : 1.0,
     *     blue : 0.0
     *     alpha : 1.0
     * };
     *
     * // Create the default material:
     * polygon.material = new Material();
     *
     * // Create a color material with full Fabric notation:
     * polygon.material = new Material({
     *     context : context,
     *     fabric : {
     *         type : 'Color',
     *         uniforms : {
     *             color : {
     *                 red : 1.0,
     *                 green : 1.0,
     *                 blue : 0.0,
     *                 alpha : 1.0
     *             }
     *         }
     *     }
     * });
     *
     * @see <a href='https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric'>Fabric wiki page</a> for a more detailed description of Fabric.
     */
    var Material = function(description) {
        this._description = defaultValue(description, {});
        this._context = this._description.context;
        this._strict = defaultValue(this._description.strict, false);
        this._template = defaultValue(this._description.fabric, {});
        this._template.uniforms = defaultValue(this._template.uniforms, {});
        this._template.materials = defaultValue(this._template.materials, {});

        /**
         * The material type. Can be an existing type or a new type. If no type is specified in fabric, type is undefined.
         * @type String
         */
        Object.defineProperty(this, 'type', { value : this._template.type, writable : false});
        /**
         * The glsl shader source for this material.
         * @type String
         */
        this.shaderSource = '';
        /**
         * Maps sub-material names to Material objects.
         * @type Object
         */
        this.materials = {};
        /**
         * Maps uniform names to their values.
         * @type Object
         */
        this.uniforms = {};
        this._uniforms = {};

        // If the cache contains this material type, build the material template off of the stored template.
        var oldMaterialTemplate = Material._materialCache.getMaterial(this.type);
        if (typeof oldMaterialTemplate !== 'undefined') {
            this._template = combine([this._template, oldMaterialTemplate]);
        }

        // Make sure the template has no obvious errors. More error checking happens later.
        checkForTemplateErrors(this);

        // If the material has a new type, add it to the cache.
        if ((typeof oldMaterialTemplate === 'undefined') && (typeof this.type !== 'undefined')){
            Material._materialCache.addMaterial(this.type, this._template);
        }

        createMethodDefinition(this);
        createUniforms(this);
        createSubMaterials(this);
    };

    /**
     * Creates a new material using an existing material type.
     * <br /><br />
     * Shorthand for: new Material({context : context, fabric : {type : type}});
     *
     * @param {Context} context The context used to create textures if the material uses them.
     * @param {String} type The base material type.
     *
     * @returns {Material} New material object.
     *
     * @exception {DeveloperError} material with that type does not exist.
     *
     * @example
     * var material = Material.fromType(context, 'Color');
     * material.uniforms.color = vec4(1.0, 0.0, 0.0, 1.0);
     */
    Material.fromType = function(context, type) {
        if (typeof Material._materialCache.getMaterial(type) === 'undefined') {
            throw new DeveloperError('material with type \'' + type + '\' does not exist.');
        }
        return new Material({
            context : context,
            fabric : {
                type : type
            }
        });
    };

    /**
    * Returns true if this object was destroyed; otherwise, false.
    * <br /><br />
    * If this object was destroyed, it should not be used; calling any function other than
    * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
    *
    * @memberof Material
    *
    * @returns {Boolean} True if this object was destroyed; otherwise, false.
    *
    * @see Material#destroy
    */
   Material.prototype.isDestroyed = function() {
       return false;
   };

   /**
    * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
    * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
    * <br /><br />
    * Once an object is destroyed, it should not be used; calling any function other than
    * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
    * assign the return value (<code>undefined</code>) to the object as done in the example.
    *
    * @memberof Material
    *
    * @returns {undefined}
    *
    * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
    *
    * @see Material#isDestroyed
    *
    * @example
    * material = material && material.destroy();
    */
    Material.prototype.destroy = function() {
        var materials = this.materials;
        var uniforms = this.uniforms;
        for (var uniformId in uniforms) {
            if (uniforms.hasOwnProperty(uniformId)) {
                var uniformValue = uniforms[uniformId];
                if (uniformValue instanceof Texture || uniformValue instanceof CubeMap) {
                    Material._textureCache.releaseTexture(this, uniformValue);
                }
            }
        }
        for (var material in materials) {
            if (materials.hasOwnProperty(material)) {
                material.destroy();
            }
        }
        return destroyObject(this);
    };

    var checkForTemplateErrors = function(material) {
        var template = material._template;
        var uniforms = material._template.uniforms;
        var materials = material._template.materials;
        var components = material._template.components;
        var source = material._template.source;

        // Make sure source and components do not exist in the same template.
        if ((typeof components !== 'undefined') && (typeof source !== 'undefined')) {
            throw new DeveloperError('fabric: cannot have source and components in the same template.');
        }

        var checkForValidProperties = function(object, properties, result, throwNotFound) {
            if (typeof object !== 'undefined') {
                for (var property in object) {
                    if (object.hasOwnProperty(property)) {
                        var hasProperty = properties.indexOf(property) !== -1;
                        if ((throwNotFound && !hasProperty) || (!throwNotFound && hasProperty)) {
                            result(property, properties);
                        }
                    }
                }
            }
        };

        // Make sure all template and components properties are valid.
        var invalidNameError = function(property, properties) {
            var errorString = 'fabric: property name \'' + property + '\' is not valid. It should be ';
            for (var i = 0; i < properties.length; i++) {
                var propertyName = '\'' + properties[i] + '\'';
                errorString += (i === properties.length - 1) ? ('or ' + propertyName + '.') : (propertyName + ', ');
            }
            throw new DeveloperError(errorString);
        };
        checkForValidProperties(template, ['type', 'materials', 'uniforms', 'components', 'source'], invalidNameError, true);
        checkForValidProperties(components,  ['diffuse', 'specular', 'normal', 'emission', 'alpha'], invalidNameError, true);

        // Make sure uniforms and materials do not share any of the same names.
        var duplicateNameError = function(property, properties) {
            var errorString = 'fabric: uniforms and materials cannot share the same property \'' + property + '\'';
            throw new DeveloperError(errorString);
        };
        var materialNames = [];
        for (var property in materials) {
            if (materials.hasOwnProperty(property)) {
                materialNames.push(property);
            }
        }
        checkForValidProperties(uniforms, materialNames, duplicateNameError, false);
    };

    // Create the agi_getMaterial method body using source or components.
    var createMethodDefinition = function(material) {
        var components = material._template.components;
        var source = material._template.source;
        if (typeof source !== 'undefined') {
            material.shaderSource += source + '\n';
        }
        else {
            material.shaderSource += 'agi_material agi_getMaterial(agi_materialInput materialInput)\n{\n';
            material.shaderSource += 'agi_material material = agi_getDefaultMaterial(materialInput);\n';
            if (typeof components !== 'undefined') {
                for (var component in components) {
                    if (components.hasOwnProperty(component)) {
                        material.shaderSource += 'material.' + component + ' = ' + components[component] + ';\n';
                    }
                }
            }
            material.shaderSource += 'return material;\n}\n';
        }
    };

    var createUniforms = function(material) {
        var uniforms = material._template.uniforms;
        for (var uniformId in uniforms) {
            if (uniforms.hasOwnProperty(uniformId)) {
                createUniform(material, uniformId);
            }
        }
    };

    // Writes uniform declarations to the shader file and connects uniform values with
    // corresponding material properties through the returnUniforms function.
    var createUniform = function(material, uniformId) {
        var context = material._context;
        var strict = material._strict;
        var materialUniforms = material._template.uniforms;
        var uniformValue = materialUniforms[uniformId];
        var uniformType = getUniformType(uniformValue);
        if (typeof uniformType === 'undefined') {
            throw new DeveloperError('fabric: uniform \'' + uniformId + '\' has invalid type.');
        }
        else if (uniformType === 'channels') {
            if (replaceToken(material, uniformId, uniformValue, false) === 0 && strict) {
                throw new DeveloperError('strict: shader source does not use channels \'' + uniformId + '\'.');
            }
        }
        else {
            // If uniform type is an image, add image dimension uniforms.
            if (uniformType.indexOf('sampler') !== -1) {
                if (typeof context === 'undefined') {
                    throw new DeveloperError('image: context is not defined');
                }
            }
            // Since webgl doesn't allow texture dimension queries in glsl, create a uniform to do it.
            // Check if the shader source actually uses texture dimensions before creating the uniform.
            if (uniformType === 'sampler2D') {
                var imageDimensionsUniformName = uniformId + 'Dimensions';
                if (getNumberOfTokens(material, imageDimensionsUniformName) > 0) {
                    materialUniforms[imageDimensionsUniformName] = {type : 'ivec3', x : 1, y : 1};
                    createUniform(material, imageDimensionsUniformName);
                }
            }
            // Add uniform declaration to source code.
            var uniformPhrase = 'uniform ' + uniformType + ' ' + uniformId + ';\n';
            if (material.shaderSource.indexOf(uniformPhrase) === -1) {
                material.shaderSource = uniformPhrase + material.shaderSource;
            }
            // Replace uniform name with guid version.
            var newUniformId = uniformId + '_' + getRandomId();
            if (replaceToken(material, uniformId, newUniformId) === 1 && strict) {
                throw new DeveloperError('strict: shader source does not use uniform \'' + uniformId + '\'.');
            }
            // Set uniform value
            material.uniforms[uniformId] = uniformValue;
            material._uniforms[newUniformId] = returnUniform(material, uniformId, uniformType);
        }
    };

    // Checks for updates to material values to refresh the uniforms.
    var matrixMap = {'mat2' : Matrix2, 'mat3' : Matrix3, 'mat4' : Matrix4};
    var returnUniform = function (material, uniformId, originalUniformType) {
        return function() {
            var uniforms = material.uniforms;
            var uniformValue = uniforms[uniformId];
            var uniformType = getUniformType(uniformValue);

            if (originalUniformType === 'sampler2D' && (uniformType === originalUniformType || uniformValue instanceof Texture)) {
                if (uniformType === originalUniformType) {
                    uniformValue = Material._textureCache.registerTexture2DToMaterial(material, uniformId, uniformValue);
                }
                // Since texture dimensions can't be updated manually, update them when the texture is updated.
                var uniformDimensionsName = uniformId + 'Dimensions';
                if(uniforms.hasOwnProperty(uniformDimensionsName)) {
                    var uniformDimensions = uniforms[uniformDimensionsName];
                    uniformDimensions.x = uniformValue._width;
                    uniformDimensions.y = uniformValue._height;
                }
            }
            else if (originalUniformType === 'samplerCube' && (uniformType === originalUniformType || uniformValue instanceof CubeMap)) {
                if (uniformType === originalUniformType) {
                    uniformValue = Material._textureCache.registerCubeMapToMaterial(material, uniformId, uniformValue);
                }
            }
            else if (originalUniformType.indexOf('mat') !== -1 && (uniformType === originalUniformType || uniformValue instanceof matrixMap[originalUniformType])) {
                if (uniformType === originalUniformType) {
                    uniformValue = matrixMap[originalUniformType].fromColumnMajorArray(uniformValue);
                }
            }
            else if (typeof uniformType === 'undefined' || originalUniformType !== uniformType) {
                throw new DeveloperError('fabric: uniform \'' + uniformId + '\' has invalid value.');
            }
            uniforms[uniformId] = uniformValue;
            return uniforms[uniformId];
        };
    };

    // Determines the uniform type based on the uniform in the template.
    var getUniformType = function(uniformValue) {
        var uniformType = uniformValue.type;
        if (typeof uniformType === 'undefined') {
            var type = typeof uniformValue;
            if (type === 'number') {
                uniformType = 'float';
            }
            else if (type === 'boolean') {
                uniformType = 'bool';
            }
            else if (type === 'string') {
                if (/^([rgba]){1,4}$/i.test(uniformValue)) {
                    uniformType = 'channels';
                }
                else if (uniformValue === Material.DefaultCubeMapId) {
                    uniformType = 'samplerCube';
                }
                else {
                    uniformType = 'sampler2D';
                }
            }
            else if (type === 'object') {
                if (Array.isArray(uniformValue)) {
                    if (uniformValue.length === 4 || uniformValue.length === 9 || uniformValue.length === 16) {
                        uniformType = 'mat' + Math.sqrt(uniformValue.length);
                    }
                }
                else {
                    var numAttributes = 0;
                    for (var attribute in uniformValue) {
                        if (uniformValue.hasOwnProperty(attribute)) {
                            numAttributes += 1;
                        }
                    }
                    if (numAttributes >= 2 && numAttributes <= 4) {
                        uniformType = 'vec' + numAttributes;
                    }
                    else if (numAttributes === 6) {
                        uniformType = 'samplerCube';
                    }
                }
            }
        }
        return uniformType;
    };

    // Create all sub-materials by combining source and uniforms together.
    var createSubMaterials = function(material) {
        var context = material._context;
        var strict = material._strict;
        var subMaterialTemplates = material._template.materials;
        for (var subMaterialId in subMaterialTemplates) {
            if (subMaterialTemplates.hasOwnProperty(subMaterialId)) {
                // Construct the sub-material.
                var subMaterial = new Material({context : context, strict : strict, fabric : subMaterialTemplates[subMaterialId]});
                material._uniforms = combine([material._uniforms, subMaterial._uniforms]);
                material.materials[subMaterialId] = subMaterial;

                // Make the material's agi_getMaterial unique by appending a guid.
                var originalMethodName = 'agi_getMaterial';
                var newMethodName = originalMethodName + '_' + getRandomId();
                replaceToken(subMaterial, originalMethodName, newMethodName);
                material.shaderSource = subMaterial.shaderSource + material.shaderSource;

                // Replace each material id with an agi_getMaterial method call.
                var materialMethodCall = newMethodName + '(materialInput)';
                if (replaceToken(material, subMaterialId, materialMethodCall) === 0 && strict) {
                    throw new DeveloperError('strict: shader source does not use material \'' + subMaterialId + '\'.');
                }
            }
        }
    };

    // Used for searching or replacing a token in a material's shader source with something else.
    // If excludePeriod is true, do not accept tokens that are preceded by periods.
    // http://stackoverflow.com/questions/641407/javascript-negative-lookbehind-equivalent
    var replaceToken = function(material, token, newToken, excludePeriod) {
        excludePeriod = defaultValue(excludePeriod, true);
        var count = 0;
        var invalidCharacters = 'a-zA-Z0-9_';
        var suffixChars = '([' + invalidCharacters + '])?';
        var prefixChars = '([' + invalidCharacters + (excludePeriod ? '.' : '') + '])?';
        var regExp = new RegExp(prefixChars + token + suffixChars, 'g');
        material.shaderSource = material.shaderSource.replace(regExp, function($0, $1, $2) {
            if ($1 || $2) {
                return $0;
            }
            count += 1;
            return newToken;
        });
        return count;
    };

    var getNumberOfTokens = function(material, token, excludePeriod) {
        return replaceToken(material, token, token, excludePeriod);
    };

    // Returns a random id for differentiating uniforms and materials with the same names.
    var getRandomId = function() {
        return createGuid().slice(0,8);
    };

    Material._textureCache = {
        _pathsToMaterials : {},

        _pathsToTextures : {},

        _updateMaterialsOnLoad : function(texture, path) {
            this._pathsToTextures[path] = texture;
            var materialContainers = this._pathsToMaterials[path];
            for (var i = 0; i < materialContainers.length; i++) {
                var materialContainer = materialContainers[i];
                var material = materialContainer.material;
                var property = materialContainer.property;
                this.releaseTexture(material, material.uniforms[property]);
                material.uniforms[property] = texture;
            }
        },

        releaseTexture : function(material, texture) {
            var pathsToTexture = this._pathsToTextures;
            for (var path in pathsToTexture) {
                if (pathsToTexture[path] === texture) {
                    var materialsWithTexture = this._pathsToMaterials[path];
                    for (var i = 0; i < materialsWithTexture.length; i++) {
                        if (materialsWithTexture[i].material === material) {
                            materialsWithTexture.splice(i, 1);
                            var numMaterialsWithTexture = materialsWithTexture.length;
                            if (numMaterialsWithTexture === 0) {
                                texture.destroy();
                                delete pathsToTexture.path;
                                delete materialsWithTexture.path;
                            }
                        }
                    }
                }
            }
        },

        registerCubeMapToMaterial : function(material, property, info) {
            var that = this;
            var texture;
            if (info === Material.DefaultCubeMapId) {
                texture = material._context.getDefaultCubeMap();
            }
            else {
                var path = info.positiveX + info.negativeX + info.positiveY + info.negativeY + info.positiveZ + info.negativeZ;
                this._pathsToMaterials[path] = defaultValue(this._pathsToMaterials[path], []);
                this._pathsToMaterials[path].push({'material' : material, 'property' : property});
                texture = this._pathsToTextures[path];
                if (typeof texture === 'undefined') {
                    var oldTexture = material.uniforms[property];
                    var hasOldTexture = oldTexture instanceof CubeMap;
                    texture = hasOldTexture ? oldTexture : material._context.getDefaultCubeMap();
                    if (this._pathsToMaterials[path].length === 1) {
                        when.all([loadImage(info.positiveX), loadImage(info.negativeX), loadImage(info.positiveY), loadImage(info.negativeY), loadImage(info.positiveZ), loadImage(info.negativeZ)]).then(function(images) {
                            texture = material._context.createCubeMap({source : {positiveX : images[0], negativeX : images[1], positiveY : images[2], negativeY : images[3], positiveZ : images[4], negativeZ : images[5]}});
                            that._updateMaterialsOnLoad(texture, path);
                        });
                    }
                }
            }
            return texture;
        },

        registerTexture2DToMaterial : function(material, property, info) {
            var that = this;
            var texture;
            if (info === Material.DefaultImageId) {
                texture = material._context.getDefaultTexture();
            }
            else {
                var path = info;
                this._pathsToMaterials[path] = defaultValue(this._pathsToMaterials[path], []);
                this._pathsToMaterials[path].push({'material' : material, 'property' : property});
                texture = this._pathsToTextures[path];
                if (typeof texture === 'undefined') {
                    var oldTexture = material.uniforms[property];
                    var hasOldTexture = oldTexture instanceof Texture;
                    texture = hasOldTexture ? oldTexture : material._context.getDefaultTexture();
                    if (this._pathsToMaterials[path].length === 1) {
                        when(loadImage(path), function(image) {
                            texture = material._context.createTexture2D({source : image});
                            that._updateMaterialsOnLoad(texture, path);
                        });
                    }
                }
            }
            return texture;
        }
    };

    Material._materialCache = {
        _materials : {},
        addMaterial : function (type, materialTemplate) {
            this._materials[type] = materialTemplate;
        },
        getMaterial : function (type) {
            return this._materials[type];
        }
    };

    Material.DefaultImageId = 'agi_defaultImage';
    Material.DefaultCubeMapId = 'agi_defaultCubeMap';

    Material.ColorType = 'Color';
    Material._materialCache.addMaterial(Material.ColorType, {
        type : Material.ColorType,
        uniforms : {
            color : new Color(1.0, 0.0, 0.0, 0.5)
        },
        components : {
            diffuse : 'color.rgb',
            alpha : 'color.a'
        }
    });

    Material.ImageType = 'Image';
    Material._materialCache.addMaterial(Material.ImageType, {
        type : Material.ImageType,
        uniforms : {
            image : Material.DefaultImageId,
            repeat : {
                x : 1,
                y : 1
            }
        },
        components : {
            diffuse : 'texture2D(image, fract(repeat * materialInput.st)).rgb',
            alpha : 'texture2D(image, fract(repeat * materialInput.st)).a'
        }
    });

    Material.DiffuseMapType = 'DiffuseMap';
    Material._materialCache.addMaterial(Material.DiffuseMapType, {
        type : Material.DiffuseMapType,
        uniforms : {
            image : Material.DefaultImageId,
            channels : 'rgb',
            repeat : {
                x : 1,
                y : 1
            }
        },
        components : {
            diffuse : 'texture2D(image, fract(repeat * materialInput.st)).channels'
        }
    });

    Material.AlphaMapType = 'AlphaMap';
    Material._materialCache.addMaterial(Material.AlphaMapType, {
        type : Material.AlphaMapType,
        uniforms : {
            image : Material.DefaultImageId,
            channel : 'a',
            repeat : {
                x : 1,
                y : 1
            }
        },
        components : {
            alpha : 'texture2D(image, fract(repeat * materialInput.st)).channel'
        }
    });

    Material.SpecularMapType = 'SpecularMap';
    Material._materialCache.addMaterial(Material.SpecularMapType , {
        type : Material.SpecularMapType,
        uniforms : {
            image : Material.DefaultImageId,
            channel : 'r',
            repeat : {
                x : 1,
                y : 1
            }
        },
        components : {
            specular : 'texture2D(image, fract(repeat * materialInput.st)).channel'
        }
    });

    Material.EmissionMapType = 'EmissionMap';
    Material._materialCache.addMaterial(Material.EmissionMapType , {
        type : Material.EmissionMapType,
        uniforms : {
            image : Material.DefaultImageId,
            channels : 'rgb',
            repeat : {
                x : 1,
                y : 1
            }
        },
        components : {
            emission : 'texture2D(image, fract(repeat * materialInput.st)).channels'
        }
    });

    Material.BumpMapType = 'BumpMap';
    Material._materialCache.addMaterial(Material.BumpMapType , {
        type : Material.BumpMapType,
        uniforms : {
            image : Material.DefaultImageId,
            channel : 'r',
            strength : 0.8,
            repeat : {
                x : 1,
                y : 1
            }
        },
        source : BumpMapMaterial
    });

    Material.NormalMapType = 'NormalMap';
    Material._materialCache.addMaterial(Material.NormalMapType, {
        type : Material.NormalMapType,
        uniforms : {
            image : Material.DefaultImageId,
            channels : 'rgb',
            strength : 0.8,
            repeat : {
                x : 1,
                y : 1
            }
        },
        source : NormalMapMaterial
    });

    Material.ReflectionType = 'Reflection';
    Material._materialCache.addMaterial(Material.ReflectionType, {
        type : Material.ReflectionType,
        uniforms : {
            cubeMap : Material.DefaultCubeMapId,
            channels : 'rgb'
        },
        source : ReflectionMaterial
    });

    Material.RefractionType = 'Refraction';
    Material._materialCache.addMaterial(Material.RefractionType, {
        type : Material.RefractionType,
        uniforms : {
            cubeMap : Material.DefaultCubeMapId,
            channels : 'rgb',
            indexOfRefractionRatio : 0.9
        },
        source : RefractionMaterial
    });

    Material.FresnelType = 'Fresnel';
    Material._materialCache.addMaterial(Material.FresnelType , {
        type : Material.FresnelType,
        materials : {
            reflection : {
                type : Material.ReflectionType
            },
            refraction : {
                type : Material.RefractionType
            }
        },
        source : FresnelMaterial
    });

    Material.BrickType = 'Brick';
    Material._materialCache.addMaterial(Material.BrickType, {
        type : Material.BrickType,
        uniforms : {
            brickColor : {
                red: 0.6,
                green: 0.3,
                blue: 0.1,
                alpha: 1.0
            },
            mortarColor : {
                red : 0.8,
                green : 0.8,
                blue : 0.7,
                alpha : 1.0
            },
            brickSize : {
                x : 0.30,
                y : 0.15
            },
            brickPct : {
                x : 0.90,
                y : 0.85
            },
            brickRoughness : 0.2,
            mortarRoughness : 0.1
        },
        source : BrickMaterial
    });

    Material.WoodType = 'Wood';
    Material._materialCache.addMaterial(Material.WoodType, {
        type : Material.WoodType,
        uniforms : {
            lightWoodColor : {
                red : 0.6,
                green : 0.3,
                blue : 0.1,
                alpha : 1.0
            },
            darkWoodColor : {
                red : 0.4,
                green : 0.2,
                blue : 0.07,
                alpha : 1.0
            },
            ringFrequency : 3.0,
            noiseScale : {
                x : 0.7,
                y : 0.5
            },
            grainFrequency : 27.0
        },
        source : WoodMaterial
    });

    Material.AsphaltType = 'Asphalt';
    Material._materialCache.addMaterial(Material.AsphaltType, {
        type : Material.AsphaltType,
        uniforms : {
            asphaltColor : {
                red : 0.15,
                green : 0.15,
                blue : 0.15,
                alpha : 1.0
            },
            bumpSize : 0.02,
            roughness : 0.2
        },
        source : AsphaltMaterial
    });

    Material.CementType = 'Cement';
    Material._materialCache.addMaterial(Material.CementType, {
        type : Material.CementType,
        uniforms : {
            cementColor : {
                red : 0.95,
                green : 0.95,
                blue : 0.85,
                alpha : 1.0
            },
            grainScale : 0.01,
            roughness : 0.3
        },
        source : CementMaterial
    });

    Material.GrassType = 'Grass';
    Material._materialCache.addMaterial(Material.GrassType, {
        type : Material.GrassType,
        uniforms : {
            grassColor : {
                red : 0.25,
                green : 0.4,
                blue : 0.1,
                alpha : 1.0
            },
            dirtColor : {
                red : 0.1,
                green : 0.1,
                blue : 0.1,
                alpha : 1.0
            },
            patchiness : 1.5
        },
        source : GrassMaterial
    });

    Material.StripeType = 'Stripe';
    Material._materialCache.addMaterial(Material.StripeType, {
        type : Material.StripeType,
        uniforms : {
            horizontal : true,
            lightColor : {
                red : 1.0,
                green : 1.0,
                blue : 1.0,
                alpha : 0.5
            },
            darkColor : {
                red : 0.0,
                green : 0.0,
                blue : 1.0,
                alpha : 0.5
            },
            offset : 0.0,
            repeat : 5.0
        },
        source : StripeMaterial
    });

    Material.CheckerboardType = 'Checkerboard';
    Material._materialCache.addMaterial(Material.CheckerboardType, {
        type : Material.CheckerboardType,
        uniforms : {
            lightColor : {
                red : 1.0,
                green : 1.0,
                blue : 1.0,
                alpha : 0.5
            },
            darkColor : {
                red : 0.0,
                green : 0.0,
                blue : 0.0,
                alpha : 0.5
            },
            repeat : {
                x : 5.0,
                y : 5.0
            }
        },
        source : CheckerboardMaterial
    });

    Material.DotType = 'Dot';
    Material._materialCache.addMaterial(Material.DotType, {
        type : Material.DotType,
        uniforms : {
            lightColor : {
                red : 1.0,
                green : 1.0,
                blue : 0.0,
                alpha : 0.75
            },
            darkColor : {
                red : 0.0,
                green : 1.0,
                blue : 1.0,
                alpha : 0.75
            },
            repeat : {
                x : 5.0,
                y : 5.0
            }
        },
        source : DotMaterial
    });

    Material.TyeDyeType = 'TieDye';
    Material._materialCache.addMaterial(Material.TyeDyeType, {
        type : Material.TyeDyeType,
        uniforms : {
            lightColor : {
                red : 1.0,
                green : 1.0,
                blue : 0.0,
                alpha : 0.75
            },
            darkColor : {
                red : 1.0,
                green : 0.0,
                blue : 0.0,
                alpha : 0.75
            },
            frequency : 5.0
        },
        source : TieDyeMaterial
    });

    Material.FacetType = 'Facet';
    Material._materialCache.addMaterial(Material.FacetType, {
        type : Material.FacetType,
        uniforms : {
            lightColor : {
                red : 0.25,
                green : 0.25,
                blue : 0.25,
                alpha : 0.75
            },
            darkColor : {
                red : 0.75,
                green : 0.75,
                blue : 0.75,
                alpha : 0.75
            },
            frequency : 10.0
        },
        source : FacetMaterial
    });

    Material.BlobType = 'Blob';
    Material._materialCache.addMaterial(Material.BlobType, {
        type : Material.BlobType,
        uniforms : {
            lightColor : {
                red : 1.0,
                green : 1.0,
                blue : 1.0,
                alpha : 0.5
            },
            darkColor : {
                red : 0.0,
                green : 0.0,
                blue : 1.0,
                alpha : 0.5
            },
            frequency : 10.0
        },
        source : BlobMaterial
    });

    return Material;
});