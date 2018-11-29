window.Triangle = window.classes.Triangle =
class Triangle extends Shape    // The simplest possible Shape – one triangle.  It has 3 vertices, each
{ constructor()                 // having their own 3D position, normal vector, and texture-space coordinate.
    { super( "positions", "normals", "texture_coords" );                       // Name the values we'll define per each vertex.
                                  // First, specify the vertex positions -- the three point locations of an imaginary triangle.
                                  // Next, supply vectors that point away from the triangle face.  They should match up with the points in 
                                  // the above list.  Normal vectors are needed so the graphics engine can know if the shape is pointed at 
                                  // light or not, and color it accordingly.  lastly, put each point somewhere in texture space too.
      this.positions      = [ Vec.of(0,0,0), Vec.of(1,0,0), Vec.of(0,1,0) ];
      this.normals        = [ Vec.of(0,0,1), Vec.of(0,0,1), Vec.of(0,0,1) ];
      this.texture_coords = [ Vec.of(0,0),   Vec.of(1,0),   Vec.of(0,1)   ]; 
      this.indices        = [ 0, 1, 2 ];                         // Index into our vertices to connect them into a whole triangle.
                 // A position, normal, and texture coord fully describes one "vertex".  What's the "i"th vertex?  Simply the combined data 
                 // you get if you look up index "i" of those lists above -- a position, normal vector, and tex coord together.  Lastly we
                 // told it how to connect vertex entries into triangles.  Every three indices in "this.indices" traces out one triangle.
    }
}


window.Square = window.classes.Square =
class Square extends Shape              // A square, demonstrating two triangles that share vertices.  On any planar surface, the interior 
                                        // edges don't make any important seams.  In these cases there's no reason not to re-use data of
{                                       // the common vertices between triangles.  This makes all the vertex arrays (position, normals, 
  constructor()                         // etc) smaller and more cache friendly.
    { super( "positions", "normals", "texture_coords" );                                   // Name the values we'll define per each vertex.
      this.positions     .push( ...Vec.cast( [-1,-1,0], [1,-1,0], [-1,1,0], [1,1,0] ) );   // Specify the 4 square corner locations.
      this.normals       .push( ...Vec.cast( [0,0,1],   [0,0,1],  [0,0,1],  [0,0,1] ) );   // Match those up with normal vectors.
      this.texture_coords.push( ...Vec.cast( [0,0],     [1,0],    [0,1],    [1,1]   ) );   // Draw a square in texture coordinates too.
      this.indices       .push( 0, 1, 2,     1, 3, 2 );                   // Two triangles this time, indexing into four distinct vertices.
    }
}


window.Tetrahedron = window.classes.Tetrahedron =
class Tetrahedron extends Shape                       // The Tetrahedron shape demonstrates flat vs smooth shading (a boolean argument 
{ constructor( using_flat_shading )                   // selects which one).  It is also our first 3D, non-planar shape.
    { super( "positions", "normals", "texture_coords" );
      var a = 1/Math.sqrt(3);
      if( !using_flat_shading )                                 // Method 1:  A tetrahedron with shared vertices.  Compact, performs better,
      {                                                         // but can't produce flat shading or discontinuous seams in textures.
          this.positions     .push( ...Vec.cast( [ 0, 0, 0], [1,0,0], [0,1,0], [0,0,1] ) );          
          this.normals       .push( ...Vec.cast( [-a,-a,-a], [1,0,0], [0,1,0], [0,0,1] ) );          
          this.texture_coords.push( ...Vec.cast( [ 0, 0   ], [1,0  ], [0,1, ], [1,1  ] ) );
          this.indices       .push( 0, 1, 2,   0, 1, 3,   0, 2, 3,    1, 2, 3 );  // Vertices are shared multiple times with this method.
      }
      else
      { this.positions     .push( ...Vec.cast( [0,0,0], [1,0,0], [0,1,0],         // Method 2:  A tetrahedron with 
                                               [0,0,0], [1,0,0], [0,0,1],         // four independent triangles.
                                               [0,0,0], [0,1,0], [0,0,1],
                                               [0,0,1], [1,0,0], [0,1,0] ) );

        this.normals       .push( ...Vec.cast( [0,0,-1], [0,0,-1], [0,0,-1],        // This here makes Method 2 flat shaded, since values
                                               [0,-1,0], [0,-1,0], [0,-1,0],        // of normal vectors can be constant per whole
                                               [-1,0,0], [-1,0,0], [-1,0,0],        // triangle.  Repeat them for all three vertices.
                                               [ a,a,a], [ a,a,a], [ a,a,a] ) );

        this.texture_coords.push( ...Vec.cast( [0,0], [1,0], [1,1],      // Each face in Method 2 also gets its own set of texture coords
                                               [0,0], [1,0], [1,1],      //(half the image is mapped onto each face).  We couldn't do this
                                               [0,0], [1,0], [1,1],      // with shared vertices since this features abrupt transitions
                                               [0,0], [1,0], [1,1] ) );  // when approaching the same point from different directions.

        this.indices.push( 0, 1, 2,    3, 4, 5,    6, 7, 8,    9, 10, 11 );      // Notice all vertices are unique this time.
      }
    }
}


window.Windmill = window.classes.Windmill =
class Windmill extends Shape                     // Windmill Shape.  As our shapes get more complicated, we begin using matrices and flow
{ constructor( num_blades )                      // control (including loops) to generate non-trivial point clouds and connect them.
    { super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < num_blades; i++ )     // A loop to automatically generate the triangles.
        {                                                                                   // Rotate around a few degrees in the
          var spin = Mat4.rotation( i * 2*Math.PI/num_blades, Vec.of( 0,1,0 ) );            // XZ plane to place each new point.
          var newPoint  = spin.times( Vec.of( 1,0,0,1 ) ).to3();   // Apply that XZ rotation matrix to point (1,0,0) of the base triangle.
          this.positions.push( newPoint,                           // Store this XZ position.                  This is point 1.
                               newPoint.plus( [ 0,1,0 ] ),         // Store it again but with higher y coord:  This is point 2.
                                        Vec.of( 0,0,0 )    );      // All triangles touch this location.       This is point 3.

                        // Rotate our base triangle's normal (0,0,1) to get the new one.  Careful!  Normal vectors are not points; 
                        // their perpendicularity constraint gives them a mathematical quirk that when applying matrices you have
                        // to apply the transposed inverse of that matrix instead.  But right now we've got a pure rotation matrix, 
                        // where the inverse and transpose operations cancel out.
          var newNormal = spin.times( Vec.of( 0,0,1 ).to4(0) ).to3();  
          this.normals       .push( newNormal, newNormal, newNormal          );
          this.texture_coords.push( ...Vec.cast( [ 0,0 ], [ 0,1 ], [ 1,0 ] ) );
          this.indices       .push( 3*i, 3*i + 1, 3*i + 2                    ); // Procedurally connect the 3 new vertices into triangles.
        }
    }
}


window.Cube = window.classes.Cube =
class Cube extends Shape    // A cube inserts six square strips into its arrays.
{ constructor()  
    { super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < 3; i++ )                    
        for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          Square.insert_transformed_copy_into( this, [], square_transform );
        }
    }
}


window.Subdivision_Sphere = window.classes.Subdivision_Sphere =
class Subdivision_Sphere extends Shape  // This Shape defines a Sphere surface, with nice uniform triangles.  A subdivision surface (see
{                                       // Wikipedia article on those) is initially simple, then builds itself into a more and more 
                                        // detailed shape of the same layout.  Each act of subdivision makes it a better approximation of 
                                        // some desired mathematical surface by projecting each new point onto that surface's known 
                                        // implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For each
                                        // face, connect the midpoints of each edge together to make more faces.  Repeat recursively until 
                                        // the desired level of detail is obtained.  Project all new vertices to unit vectors (onto the                                         
  constructor( max_subdivisions )       // unit sphere) and group them into triangles by following the predictable pattern of the recursion.
    { super( "positions", "normals", "texture_coords" );                      // Start from the following equilateral tetrahedron:
      this.positions.push( ...Vec.cast( [ 0, 0, -1 ], [ 0, .9428, .3333 ], [ -.8165, -.4714, .3333 ], [ .8165, -.4714, .3333 ] ) );
      
      this.subdivideTriangle( 0, 1, 2, max_subdivisions);  // Begin recursion.
      this.subdivideTriangle( 3, 2, 1, max_subdivisions);
      this.subdivideTriangle( 1, 0, 3, max_subdivisions);
      this.subdivideTriangle( 0, 2, 3, max_subdivisions); 
      
      for( let p of this.positions )
        { this.normals.push( p.copy() );                 // Each point has a normal vector that simply goes to the point from the origin.

                                                         // Textures are tricky.  A Subdivision sphere has no straight seams to which image 
                                                         // edges in UV space can be mapped.  The only way to avoid artifacts is to smoothly                                                          
          this.texture_coords.push(                      // wrap & unwrap the image in reverse - displaying the texture twice on the sphere.
                                 Vec.of( Math.asin( p[0]/Math.PI ) + .5, Math.asin( p[1]/Math.PI ) + .5 ) ) }
    }
  subdivideTriangle( a, b, c, count )   // Recurse through each level of detail by splitting triangle (a,b,c) into four smaller ones.
    { 
      if( count <= 0) { this.indices.push(a,b,c); return; }  // Base case of recursion - we've hit the finest level of detail we want.
                  
      var ab_vert = this.positions[a].mix( this.positions[b], 0.5).normalized(),     // We're not at the base case.  So, build 3 new
          ac_vert = this.positions[a].mix( this.positions[c], 0.5).normalized(),     // vertices at midpoints, and extrude them out to
          bc_vert = this.positions[b].mix( this.positions[c], 0.5).normalized();     // touch the unit sphere (length 1).
            
      var ab = this.positions.push( ab_vert ) - 1,      // Here, push() returns the indices of the three new vertices (plus one).
          ac = this.positions.push( ac_vert ) - 1,  
          bc = this.positions.push( bc_vert ) - 1;  
      
      this.subdivideTriangle( a, ab, ac,  count - 1 );          // Recurse on four smaller triangles, and we're done.  Skipping every
      this.subdivideTriangle( ab, b, bc,  count - 1 );          // fourth vertex index in our list takes you down one level of detail,
      this.subdivideTriangle( ac, bc, c,  count - 1 );          // and so on, due to the way we're building it.
      this.subdivideTriangle( ab, bc, ac, count - 1 );
    }
}


window.Shadow_Shader = window.classes.Shadow_Shader =
class Shadow_Shader extends Shader             // Subclasses of Shader each store and manage a complete GPU program.  This Shader is 
{                                             // the simplest example of one.  It samples pixels from colors that are directly assigned 
  material() { return { shader: this } }      // to the vertices.  Materials here are minimal, without any settings.
  map_attribute_name_to_buffer_name( name )        // The shader will pull single entries out of the vertex arrays, by their data fields'
    {                                              // names.  Map those names onto the arrays we'll pull them from.  This determines
                                                   // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
                                                   // Vertex buffers in the GPU can get their pointers matched up with pointers to 
                                                   // attribute names in the GPU.  Shapes and Shaders can still be compatible even
                                                   // if some vertex data feilds are unused. 
      return { object_space_pos: "positions" }[ name ];      // Use a simple lookup table.
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
    {
	if( !g_state.light )  return;
	var PCM = g_state.light.projection_transform.times(g_state.light.camera_transform).times(model_transform);
	gl.uniformMatrix4fv( gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
    }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos;
        uniform mat4 projection_camera_model_transform;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);         }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return `
        void main()
        {
        }`;
    }
}


window.Skybox_Shader = window.classes.Skybox_Shader =
class Skybox_Shader extends Shader          // THE DEFAULT SHADER: This uses the Phong Reflection Model, with optional Gouraud shading. 
                                           // Wikipedia has good defintions for these concepts.  Subclasses of class Shader each store 
                                           // and manage a complete GPU program.  This particular one is a big "master shader" meant to 
                                           // handle all sorts of lighting situations in a configurable way. 
                                           // Phong Shading is the act of determining brightness of pixels via vector math.  It compares
                                           // the normal vector at that pixel to the vectors toward the camera and light sources.
          // *** How Shaders Work:
                                           // The "vertex_glsl_code" string below is code that is sent to the graphics card at runtime, 
                                           // where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw 
                                           // shapes will launch the vertex shader program once per vertex in the shape (three times per 
                                           // triangle), sending results on to the next phase.  The purpose of this vertex shader program 
                                           // is to calculate the final resting place of vertices in screen coordinates; each vertex 
                                           // starts out in local object coordinates and then undergoes a matrix transform to get there.
                                           //
                                           // Likewise, the "fragment_glsl_code" string is used as the Fragment Shader program, which gets 
                                           // sent to the graphics card at runtime.  The fragment shader runs once all the vertices in a 
                                           // triangle / element finish their vertex shader programs, and thus have finished finding out 
                                           // where they land on the screen.  The fragment shader fills in (shades) every pixel (fragment) 
                                           // overlapping where the triangle landed.  It retrieves different values (such as vectors) that 
                                           // are stored at three extreme points of the triangle, and then interpolates the values weighted 
                                           // by the pixel's proximity to each extreme point, using them in formulas to determine color.
                                           // The fragment colors may or may not become final pixel colors; there could already be other 
                                           // triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the 
                                           // new triangle is closer to the camera, and even if so, blending settings may interpolate some 
                                           // of the old color into the result.  Finally, an image is displayed onscreen.
{ material( color, properties )     // Define an internal class "Material" that stores the standard settings found in Phong lighting.
  { return new class Material       // Possible properties: ambient, diffusivity, specularity, smoothness, gouraud, texture.
      { constructor( shader, color = Color.of( 0,0,0,1 ), ambient = 0, diffusivity = 1, specularity = 1, smoothness = 40 )
          { Object.assign( this, { shader, color, ambient, diffusivity, specularity, smoothness } );  // Assign defaults.
            Object.assign( this, properties );                                                        // Optionally override defaults.
          }
        override( properties )                      // Easily make temporary overridden versions of a base material, such as
          { const copied = new this.constructor();  // of a different color or diffusivity.  Use "opacity" to override only that.
            Object.assign( copied, this );
            Object.assign( copied, properties );
            copied.color = copied.color.copy();
            if( properties[ "opacity" ] != undefined ) copied.color[3] = properties[ "opacity" ];
            return copied;
          }
      }( this, color );
  }
  map_attribute_name_to_buffer_name( name )                  // We'll pull single entries out per vertex by field name.  Map
    {                                                        // those names onto the vertex array names we'll pull them from.
	return { object_space_pos: "positions", normal: "normals" }[ name ]; }   // Use a simple lookup table.
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor;
        uniform bool USE_CUBE_TEXTURE;               // Flags for alternate shading methods
        uniform vec4 lightPosition, lightColor, shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader 
        varying vec3 cube_map_coord;
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 L, H;
        varying float dist;
        
        vec3 phong_model_lights( vec3 N )
          { vec3 result = vec3(0.0);
            float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor * (dist * dist));
            float diffuse  =      max( dot(N, L), 0.0 );
            float specular = pow( max( dot(N, H), 0.0 ), smoothness );

            result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor.xyz * specularity * specular );
            return result;
          }
        `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos, normal;

        uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
        uniform mat3 inverse_transpose_modelview;

        void main()
        { cube_map_coord = object_space_pos;
          gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = normalize( -screen_space_pos );

          L = normalize( ( camera_transform * lightPosition ).xyz - lightPosition.w * screen_space_pos );
          H = normalize( L + E );
            
          // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
          dist  = lightPosition.w > 0.0 ? distance((camera_transform * lightPosition).xyz, screen_space_pos)
                                              : distance( attenuation_factor * -lightPosition.xyz, object_space_pos.xyz );
        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {                            // A fragment is a pixel that's overlapped by the current triangle.
                                 // Fragments affect the final image or get discarded due to depth.
      return `
        uniform samplerCube cube_texture;
        void main()
        { 
          vec4 cube_tex_color = textureCube( cube_texture, cube_map_coord );
          if( USE_CUBE_TEXTURE ) gl_FragColor = vec4( ( cube_tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * cube_tex_color.w );
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
    {                              // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
      this.update_matrices( g_state, model_transform, gpu, gl );
      gl.uniform1f ( gpu.animation_time_loc, g_state.animation_time / 1000 );

      gl.uniform4fv( gpu.shapeColor_loc,     material.color       );    // Send the desired shape-wide material qualities 
      gl.uniform1f ( gpu.ambient_loc,        material.ambient     );    // to the graphics card, where they will tweak the
      gl.uniform1f ( gpu.diffusivity_loc,    material.diffusivity );    // Phong lighting formula.
      gl.uniform1f ( gpu.specularity_loc,    material.specularity );
	gl.uniform1f ( gpu.smoothness_loc,     material.smoothness  );
	gl.uniform1i ( gpu.cube_texture_loc, 0);

      if ( material.cube_texture ) {
	  gl.uniform1f(gpu.USE_CUBE_TEXTURE_loc, 1);
	  gl.activeTexture(gl.TEXTURE0);
	  gl.bindTexture( gl.TEXTURE_CUBE_MAP, material.cube_texture.id );
      }
      else  { gl.uniform1f ( gpu.USE_CUBE_TEXTURE_loc, 0 );   gpu.shader_attributes["tex_coord"].enabled = false; }

	if( !g_state.light )  return;
	gl.uniform4fv( gpu.lightPosition_loc,       g_state.light.position );
	gl.uniform4fv( gpu.lightColor_loc,          g_state.light.color );
	gl.uniform1f( gpu.attenuation_factor_loc,  g_state.light.attenuation );
    }
  update_matrices( g_state, model_transform, gpu, gl )                                    // Helper function for sending matrices to GPU.
  {                                                   // (PCM will mean Projection * Camera * Model)
      let [ P, C, M ]    = [ g_state.projection_transform, g_state.camera_transform, model_transform ],
          CM     =      C.times(  M ),
          PCM    =      P.times( CM ),
          inv_CM = Mat4.inverse( CM ).sub_block([0,0], [3,3]);
                                                                  // Send the current matrices to the shader.  Go ahead and pre-compute
                                                                  // the products we'll need of the of the three special matrices and just
                                                                  // cache and send those.  They will be the same throughout this draw
                                                                  // call, and thus across each instance of the vertex shader.
                                                                  // Transpose them since the GPU expects matrices as column-major arrays.                                  
      gl.uniformMatrix4fv( gpu.camera_transform_loc,                  false, Mat.flatten_2D_to_1D(     C .transposed() ) );
      gl.uniformMatrix4fv( gpu.camera_model_transform_loc,            false, Mat.flatten_2D_to_1D(     CM.transposed() ) );
      gl.uniformMatrix4fv( gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(    PCM.transposed() ) );
      gl.uniformMatrix3fv( gpu.inverse_transpose_modelview_loc,       false, Mat.flatten_2D_to_1D( inv_CM              ) );       
  }
}


window.Phong_Shader = window.classes.Phong_Shader =
class Phong_Shader extends Shader          // THE DEFAULT SHADER: This uses the Phong Reflection Model, with optional Gouraud shading. 
                                           // Wikipedia has good defintions for these concepts.  Subclasses of class Shader each store 
                                           // and manage a complete GPU program.  This particular one is a big "master shader" meant to 
                                           // handle all sorts of lighting situations in a configurable way. 
                                           // Phong Shading is the act of determining brightness of pixels via vector math.  It compares
                                           // the normal vector at that pixel to the vectors toward the camera and light sources.
          // *** How Shaders Work:
                                           // The "vertex_glsl_code" string below is code that is sent to the graphics card at runtime, 
                                           // where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw 
                                           // shapes will launch the vertex shader program once per vertex in the shape (three times per 
                                           // triangle), sending results on to the next phase.  The purpose of this vertex shader program 
                                           // is to calculate the final resting place of vertices in screen coordinates; each vertex 
                                           // starts out in local object coordinates and then undergoes a matrix transform to get there.
                                           //
                                           // Likewise, the "fragment_glsl_code" string is used as the Fragment Shader program, which gets 
                                           // sent to the graphics card at runtime.  The fragment shader runs once all the vertices in a 
                                           // triangle / element finish their vertex shader programs, and thus have finished finding out 
                                           // where they land on the screen.  The fragment shader fills in (shades) every pixel (fragment) 
                                           // overlapping where the triangle landed.  It retrieves different values (such as vectors) that 
                                           // are stored at three extreme points of the triangle, and then interpolates the values weighted 
                                           // by the pixel's proximity to each extreme point, using them in formulas to determine color.
                                           // The fragment colors may or may not become final pixel colors; there could already be other 
                                           // triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the 
                                           // new triangle is closer to the camera, and even if so, blending settings may interpolate some 
                                           // of the old color into the result.  Finally, an image is displayed onscreen.
{ material( color, properties )     // Define an internal class "Material" that stores the standard settings found in Phong lighting.
  { return new class Material       // Possible properties: ambient, diffusivity, specularity, smoothness, gouraud, texture.
      { constructor( shader, color = Color.of( 0,0,0,1 ), ambient = 0, diffusivity = 1, specularity = 1, smoothness = 40 )
          { Object.assign( this, { shader, color, ambient, diffusivity, specularity, smoothness } );  // Assign defaults.
            Object.assign( this, properties );                                                        // Optionally override defaults.
          }
        override( properties )                      // Easily make temporary overridden versions of a base material, such as
          { const copied = new this.constructor();  // of a different color or diffusivity.  Use "opacity" to override only that.
            Object.assign( copied, this );
            Object.assign( copied, properties );
            copied.color = copied.color.copy();
            if( properties[ "opacity" ] != undefined ) copied.color[3] = properties[ "opacity" ];
            return copied;
          }
      }( this, color );
  }
  map_attribute_name_to_buffer_name( name )                  // We'll pull single entries out per vertex by field name.  Map
    {                                                        // those names onto the vertex array names we'll pull them from.
	return { object_space_pos: "positions", normal: "normals", tex_coord: "texture_coords" }[ name ]; }   // Use a simple lookup table.
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor;
        uniform bool USE_TEXTURE, USE_SHADOW_MAP;               // Flags for alternate shading methods
        uniform vec4 lightPosition, lightColor, shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader 
        varying vec2 f_tex_coord;             // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec4 shadow_coord;
        varying vec4 worldspace_coord;
        varying vec3 L, H;
        varying float dist;        
        `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos, normal;
        attribute vec2 tex_coord;

        uniform mat4 model_transform, camera_transform, camera_model_transform, projection_camera_model_transform, light_projection_camera_transform;
        uniform mat3 inverse_transpose_modelview;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          worldspace_coord = model_transform * vec4(object_space_pos, 1.0);
          shadow_coord = light_projection_camera_transform * worldspace_coord;
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          f_tex_coord = tex_coord;                                         // Directly use original texture coords and interpolate between.
          
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = normalize( -screen_space_pos );

          L = normalize( ( camera_transform * lightPosition ).xyz - lightPosition.w * screen_space_pos );
          H = normalize( L + E );
            
          // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
          dist = lightPosition.w > 0.0 ? distance((camera_transform * lightPosition).xyz, screen_space_pos)
                                              : distance( attenuation_factor * -lightPosition.xyz, object_space_pos.xyz );
        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {                            // A fragment is a pixel that's overlapped by the current triangle.
                                 // Fragments affect the final image or get discarded due to depth.
      return `
        uniform sampler2D texture;
        uniform sampler2D shadow_map;
        vec4 color;

        float random(vec3 seed, int i) {
            vec4 seed4 = vec4(seed, float(i));
            float dot_prod = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
            return fract(sin(dot_prod) * 43758.5453);
        }

        vec2 poissonDiskSample(int i) {
if(i == 0)
return vec2( -0.94201624, -0.39906216 );
if(i==1)
return vec2( 0.94558609, -0.76890725 );
if(i==2)
return vec2( -0.094184101, -0.92938870 );
if(i==3)
return vec2( 0.34495938, 0.29387760 );
if(i==4)
return vec2( -0.91588581, 0.45771432 );
if(i==5)
return vec2( -0.81544232, -0.87912464 );
if(i==6)
return vec2( -0.38277543, 0.27676845 );
if(i==7)
return vec2( 0.97484398, 0.75648379 );
if(i==8)
return vec2( 0.44323325, -0.97511554 ); 
if(i==9)
return vec2( 0.53742981, -0.47373420 );
if(i==10)
return vec2( -0.26496911, -0.41893023 );
if(i==11)
return vec2( 0.79197514, 0.19090188 );
if(i==12)
return vec2( -0.24188840, 0.99706507 ); 
if(i==13)
return vec2( -0.81409955, 0.91437590 );
if(i==14)
return vec2( 0.19984126, 0.78641367 );
if(i==15)
return vec2( 0.14383161, -0.14100790 );
        }

        vec3 phong_model_lights( vec3 N )
          { vec3 result = vec3(0.0);
            float visibility = 1.0;
            float bias = 0.005*tan(acos(dot(N,L)));
            bias = bias < 0.0 ? 0.0 : ( bias > 0.01 ? 0.01 : bias );
            const int samples = 4;
            if (USE_SHADOW_MAP) {
                for (int i=0;i<samples;i++){
                    int index = int(mod(16.0*random(floor(worldspace_coord.xyz*1000.0), i), 16.0));
                    if ( texture2D( shadow_map, shadow_coord.xy + poissonDiskSample(index)/1000.0 ).x  <  shadow_coord.z-bias ){
                        visibility-=0.8/float(samples);
                    }
                }
            }
            float attenuation_multiplier = 1.0; /// (1.0 + attenuation_factor * (dist * dist));
            float diffuse  =      max( dot(N, L), 0.0 );
            float specular = pow( max( dot(N, H), 0.0 ), smoothness );

            result += attenuation_multiplier * ( color.xyz * diffusivity * diffuse + lightColor.xyz * specularity * specular );
            return visibility*result;
          }

        void main()
        { 
          vec4 tex_color = texture2D(texture, f_tex_coord);
          color = shapeColor;

          if( USE_TEXTURE ) color = vec4(tex_color.xyz + color.xyz, tex_color.w * color.w);
          gl_FragColor = vec4( color.xyz * ambient, color.w );

          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
    {                              // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
      this.update_matrices( g_state, model_transform, gpu, gl );
      gl.uniform1f ( gpu.animation_time_loc, g_state.animation_time / 1000 );

      gl.uniform4fv( gpu.shapeColor_loc,     material.color       );    // Send the desired shape-wide material qualities 
      gl.uniform1f ( gpu.ambient_loc,        material.ambient     );    // to the graphics card, where they will tweak the
      gl.uniform1f ( gpu.diffusivity_loc,    material.diffusivity );    // Phong lighting formula.
      gl.uniform1f ( gpu.specularity_loc,    material.specularity );
	gl.uniform1f ( gpu.smoothness_loc,     material.smoothness  );
	gl.uniform1i(gpu.texture_loc, 0);
	gl.uniform1i(gpu.shadow_map_loc, 1);

      if( material.texture )                           // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
      { gpu.shader_attributes["tex_coord"].enabled = true;
        gl.uniform1f ( gpu.USE_TEXTURE_loc, 1 );
	gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture( gl.TEXTURE_2D, material.texture.id );
      }
	else  { gl.uniform1f ( gpu.USE_TEXTURE_loc, 0 ); gpu.shader_attributes["tex_coord"].enabled = false; }

	if( material.shadow_map )
	{
	    gl.uniform1f(gpu.USE_SHADOW_MAP_loc, 1);
	    gl.activeTexture(gl.TEXTURE1);
	    gl.bindTexture(gl.TEXTURE_2D, material.shadow_map.id);
	} else {
	    gl.uniform1f(gpu.USE_SHADOW_MAP_loc, 0);
	}

	if( !g_state.light )  return;
	gl.uniform4fv( gpu.lightPosition_loc,       g_state.light.position );
	gl.uniform4fv( gpu.lightColor_loc,          g_state.light.color );
	gl.uniform1f( gpu.attenuation_factor_loc,  g_state.light.attenuation );
	var depth_bias = new Mat([0.5,0.0,0.0,0.5],
				 [0.0,0.5,0.0,0.5],
				 [0.0,0.0,0.5,0.5],
				 [0.0,0.0,0.0,1.0]);
	var depth_bias_PC = depth_bias.times(g_state.light.projection_transform).times(g_state.light.camera_transform);
	gl.uniformMatrix4fv( gpu.light_projection_camera_transform_loc, false, Mat.flatten_2D_to_1D(depth_bias_PC.transposed()));
    }
  update_matrices( g_state, model_transform, gpu, gl )                                    // Helper function for sending matrices to GPU.
    {                                                   // (PCM will mean Projection * Camera * Model)
	let [ P, C, M ]    = [ g_state.projection_transform, g_state.camera_transform, model_transform ],
            CM     =      C.times(  M ),
            PCM    =      P.times( CM ),
            inv_CM = Mat4.inverse( CM ).sub_block([0,0], [3,3]);
                                                                  // Send the current matrices to the shader.  Go ahead and pre-compute
                                                                  // the products we'll need of the of the three special matrices and just
                                                                  // cache and send those.  They will be the same throughout this draw
                                                                  // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
	gl.uniformMatrix4fv( gpu.model_transform_loc,                   false, Mat.flatten_2D_to_1D(     M .transposed() ) );	    
	gl.uniformMatrix4fv( gpu.camera_transform_loc,                  false, Mat.flatten_2D_to_1D(     C .transposed() ) );
	gl.uniformMatrix4fv( gpu.camera_model_transform_loc,            false, Mat.flatten_2D_to_1D(     CM.transposed() ) );
	gl.uniformMatrix4fv( gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(    PCM.transposed() ) );
	gl.uniformMatrix3fv( gpu.inverse_transpose_modelview_loc,       false, Mat.flatten_2D_to_1D( inv_CM              ) );
    }
}
  
window.Water_Shader = window.classes.Water_Shader =
class Water_Shader extends Phong_Shader
{
    map_attribute_name_to_buffer_name( name )                  // We'll pull single entries out per vertex by field name.  Map
    {                                                        // those names onto the vertex array names we'll pull them from.
	return { object_space_pos: "positions", normal: "normals", tex_coord: "texture_coords" }[ name ]; }   // Use a simple lookup table.

  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
        uniform mat4 inverse_camera_transform;
        uniform mat3 inverse_transpose_modelview;
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor, reflectivity;
        uniform bool USE_TEXTURE, USE_ENVMAP, USE_SHADOW_MAP, USE_BUMP_MAP;               // Flags for alternate shading methods
        uniform vec4 lightPosition, lightColor, shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader 
        varying vec2 f_tex_coord;             // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
        varying vec4 shadow_coord;
        varying vec4 worldspace_coord;
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 L, H;
        varying float dist;
        `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos, normal;
        attribute vec2 tex_coord;

        uniform mat4 model_transform, camera_transform, camera_model_transform, projection_camera_model_transform, light_projection_camera_transform;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          worldspace_coord = model_transform * vec4(object_space_pos, 1.0);
          shadow_coord = light_projection_camera_transform * worldspace_coord;
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          vec3 T = normalize( inverse_transpose_modelview * vec3(1,0,0) );
          vec3 B = normalize( inverse_transpose_modelview * vec3(0,0,1) );
          mat3 TBN = mat3(T.x, B.x, N.x, T.y, B.y, N.y, T.z, B.z, N.z);
          f_tex_coord = tex_coord;                                         // Directly use original texture coords and interpolate between.
          
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = TBN * normalize( -screen_space_pos );

            L = TBN * normalize( ( camera_transform * lightPosition ).xyz - lightPosition.w * screen_space_pos );
            H = normalize( L + E );
            
            // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
            dist  = lightPosition.w > 0.0 ? distance((camera_transform * lightPosition).xyz, screen_space_pos)
                                                : distance( attenuation_factor * -lightPosition.xyz, object_space_pos.xyz );
        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {                            // A fragment is a pixel that's overlapped by the current triangle.
                                 // Fragments affect the final image or get discarded due to depth.
      return `
        uniform sampler2D texture;
        uniform samplerCube envmap;
        uniform sampler2D shadow_map;
        uniform sampler2D bump_map;

        vec4 color;

        float random(vec3 seed, int i) {
            vec4 seed4 = vec4(seed, float(i));
            float dot_prod = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
            return fract(sin(dot_prod) * 43758.5453);
        }

        vec2 poissonDiskSample(int i) {
if(i == 0)
return vec2( -0.94201624, -0.39906216 );
if(i==1)
return vec2( 0.94558609, -0.76890725 );
if(i==2)
return vec2( -0.094184101, -0.92938870 );
if(i==3)
return vec2( 0.34495938, 0.29387760 );
if(i==4)
return vec2( -0.91588581, 0.45771432 );
if(i==5)
return vec2( -0.81544232, -0.87912464 );
if(i==6)
return vec2( -0.38277543, 0.27676845 );
if(i==7)
return vec2( 0.97484398, 0.75648379 );
if(i==8)
return vec2( 0.44323325, -0.97511554 ); 
if(i==9)
return vec2( 0.53742981, -0.47373420 );
if(i==10)
return vec2( -0.26496911, -0.41893023 );
if(i==11)
return vec2( 0.79197514, 0.19090188 );
if(i==12)
return vec2( -0.24188840, 0.99706507 ); 
if(i==13)
return vec2( -0.81409955, 0.91437590 );
if(i==14)
return vec2( 0.19984126, 0.78641367 );
if(i==15)
return vec2( 0.14383161, -0.14100790 );
        }

        vec3 phong_model_lights( vec3 N )
          { vec3 result = vec3(0.0);
            float visibility = 1.0;
            float bias = 0.005*tan(acos(dot(N,L)));
            bias = bias < 0.0 ? 0.0 : ( bias > 0.01 ? 0.01 : bias );
            const int samples = 4;
            if (USE_SHADOW_MAP) {
                for (int i=0;i<samples;i++){
                    int index = int(mod(16.0*random(floor(worldspace_coord.xyz*1000.0), i), 16.0));
                    if ( texture2D( shadow_map, shadow_coord.xy + poissonDiskSample(index)/1000.0 ).x  <  shadow_coord.z-bias ){
                        visibility-=0.8/float(samples);
                    }
                }
            }
            float attenuation_multiplier = 1.0; /// (1.0 + attenuation_factor * (dist * dist));
            float diffuse  =      max( dot(N, L), 0.0 );
            float specular = pow( max( dot(N, H), 0.0 ), smoothness );

            result += attenuation_multiplier * ( color.xyz * diffusivity * diffuse + lightColor.xyz * specularity * specular );
            return visibility*result;
          }

        void main()
        { 
          vec2 tex_coord = vec2(mod(f_tex_coord.x - 0.025*animation_time, 10.0), mod(f_tex_coord.y - 0.025*animation_time, 10.0));
          vec4 tex_color = texture2D(texture, tex_coord);
          vec3 normal = N;
          if (USE_BUMP_MAP) normal = normalize(texture2D(bump_map, tex_coord).rgb * 2.0 - 1.0);
          vec3 reflected = reflect(-E, normal);
          vec3 T = normalize( inverse_transpose_modelview * vec3(1,0,0) );
          vec3 B = normalize( inverse_transpose_modelview * vec3(0,0,1)); 
          mat3 TBN_transp = mat3(T.x, T.y, T.z, B.x, B.y, B.z, N.x, N.y, N.z);
          reflected = vec3(inverse_camera_transform * vec4(TBN_transp * reflected, 0.0));
          vec4 envmap_color = textureCube( envmap, reflected );

          color = shapeColor;

          if( USE_TEXTURE ) color = vec4(tex_color.xyz + color.xyz, tex_color.w * color.w);
          if( USE_ENVMAP ) color = vec4(reflectivity*envmap_color.xyz + (1.0 - reflectivity)*color.xyz, envmap_color.w * color.w);
          gl_FragColor = vec4( color.xyz * ambient, color.w );

          gl_FragColor.xyz += phong_model_lights( normal );                     // Compute the final color with contributions from lights.
        }`;
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
    {                              // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
      this.update_matrices( g_state, model_transform, gpu, gl );
      gl.uniform1f ( gpu.animation_time_loc, g_state.animation_time / 1000 );

      gl.uniform4fv( gpu.shapeColor_loc,     material.color       );    // Send the desired shape-wide material qualities 
      gl.uniform1f ( gpu.ambient_loc,        material.ambient     );    // to the graphics card, where they will tweak the
      gl.uniform1f ( gpu.diffusivity_loc,    material.diffusivity );    // Phong lighting formula.
      gl.uniform1f ( gpu.specularity_loc,    material.specularity );
	gl.uniform1f ( gpu.smoothness_loc,     material.smoothness  );
	gl.uniform1f ( gpu.reflectivity_loc, material.reflectivity );

      gl.uniform1i(gpu.texture_loc, 0);
	gl.uniform1i(gpu.envmap_loc, 1);
	gl.uniform1i(gpu.shadow_map_loc, 2);
	gl.uniform1i(gpu.bump_map_loc, 3);

      if( material.texture )                           // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
      { gpu.shader_attributes["tex_coord"].enabled = true;
        gl.uniform1f ( gpu.USE_TEXTURE_loc, 1 );
	gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture( gl.TEXTURE_2D, material.texture.id );
      }
      else  { gl.uniform1f ( gpu.USE_TEXTURE_loc, 0 );   gpu.shader_attributes["tex_coord"].enabled = false; }

      if (material.envmap) {
        gl.uniform1f ( gpu.USE_ENVMAP_loc, 1 );
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, material.envmap.id);
      } else {
        gl.uniform1f(gpu.USE_ENVMAP_loc, 0);
      }

	if( material.shadow_map )
	{
	    gl.uniform1f(gpu.USE_SHADOW_MAP_loc, 1);
	    gl.activeTexture(gl.TEXTURE2);
	    gl.bindTexture(gl.TEXTURE_2D, material.shadow_map.id);
	} else {
	    gl.uniform1f(gpu.USE_SHADOW_MAP_loc, 0);
	}

	if( material.bump_map ) {
	    gl.uniform1f(gpu.USE_BUMP_MAP_loc, 1);
	    gl.activeTexture(gl.TEXTURE3);
	    gl.bindTexture(gl.TEXTURE_2D, material.bump_map.id);
	} else {
	    gl.uniform1f(gpu.USE_BUMP_MAP_loc, 0);
	}
	
	if( !g_state.light )  return;
	gl.uniform4fv( gpu.lightPosition_loc,       g_state.light.position );
	gl.uniform4fv( gpu.lightColor_loc,          g_state.light.color );
	gl.uniform1f( gpu.attenuation_factor_loc,  g_state.light.attenuation );
	var depth_bias = new Mat([0.5,0.0,0.0,0.5],
				 [0.0,0.5,0.0,0.5],
				 [0.0,0.0,0.5,0.5],
				 [0.0,0.0,0.0,1.0]);
	var depth_bias_PC = depth_bias.times(g_state.light.projection_transform).times(g_state.light.camera_transform);
	gl.uniformMatrix4fv( gpu.light_projection_camera_transform_loc, false, Mat.flatten_2D_to_1D(depth_bias_PC.transposed()));
    }

    update_matrices( g_state, model_transform, gpu, gl )                                    // Helper function for sending matrices to GPU.
    {                                                   // (PCM will mean Projection * Camera * Model)
      let [ P, C, M ]    = [ g_state.projection_transform, g_state.camera_transform, model_transform ],
            CM     =      C.times(  M ),
            PCM    =      P.times( CM ),
          inv_CM = Mat4.inverse( CM ).sub_block([0,0], [3,3]),
	  inv_C = Mat4.inverse( C );
                                                                  // Send the current matrices to the shader.  Go ahead and pre-compute
                                                                  // the products we'll need of the of the three special matrices and just
                                                                  // cache and send those.  They will be the same throughout this draw
                                                                  // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
	gl.uniformMatrix4fv( gpu.model_transform_loc,                   false, Mat.flatten_2D_to_1D(     M .transposed() ) );	    
      gl.uniformMatrix4fv( gpu.camera_transform_loc,                  false, Mat.flatten_2D_to_1D(     C .transposed() ) );
      gl.uniformMatrix4fv( gpu.camera_model_transform_loc,            false, Mat.flatten_2D_to_1D(     CM.transposed() ) );
      gl.uniformMatrix4fv( gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(    PCM.transposed() ) );
	gl.uniformMatrix3fv( gpu.inverse_transpose_modelview_loc,       false, Mat.flatten_2D_to_1D( inv_CM              ) );
	gl.uniformMatrix4fv( gpu.inverse_camera_transform_loc, false, Mat.flatten_2D_to_1D( inv_C.transposed() ));
    }
}


window.Movement_Controls = window.classes.Movement_Controls =
class Movement_Controls extends Scene_Component    // Movement_Controls is a Scene_Component that can be attached to a canvas, like any 
{                                                  // other Scene, but it is a Secondary Scene Component -- meant to stack alongside other
                                                   // scenes.  Rather than drawing anything it embeds both first-person and third-person
                                                   // style controls into the website.  These can be uesd to manually move your camera or
                                                   // other objects smoothly through your scene using key, mouse, and HTML button controls
                                                   // to help you explore what's in it.
  constructor( context, control_box, canvas = context.canvas )
    { super( context, control_box );
      [ this.context, this.roll, this.look_around_locked, this.invert ] = [ context, 0, true, true ];                  // Data members
      [ this.thrust, this.pos, this.z_axis ] = [ Vec.of( 0,0,0 ), Vec.of( 0,0,0 ), Vec.of( 0,0,0 ) ];
                                                 // The camera matrix is not actually stored here inside Movement_Controls; instead, track
                                                 // an external matrix to modify. This target is a reference (made with closures) kept
                                                 // in "globals" so it can be seen and set by other classes.  Initially, the default target
                                                 // is the camera matrix that Shaders use, stored in the global graphics_state object.
      this.target = function() { return context.globals.movement_controls_target() }
      context.globals.movement_controls_target = function(t) { return context.globals.graphics_state.camera_transform };
      context.globals.movement_controls_invert = this.will_invert = () => true;
      context.globals.has_controls = true;

      [ this.radians_per_frame, this.meters_per_frame, this.speed_multiplier ] = [ 1/200, 20, 1 ];
      
      // *** Mouse controls: ***
      this.mouse = { "from_center": Vec.of( 0,0 ) };                           // Measure mouse steering, for rotating the flyaround camera:
      const mouse_position = ( e, rect = canvas.getBoundingClientRect() ) => 
                                   Vec.of( e.clientX - (rect.left + rect.right)/2, e.clientY - (rect.bottom + rect.top)/2 );
                                        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas.
      document.addEventListener( "mouseup",   e => { this.mouse.anchor = undefined; } );
      canvas  .addEventListener( "mousedown", e => { e.preventDefault(); this.mouse.anchor      = mouse_position(e); } );
      canvas  .addEventListener( "mousemove", e => { e.preventDefault(); this.mouse.from_center = mouse_position(e); } );
      canvas  .addEventListener( "mouseout",  e => { if( !this.mouse.anchor ) this.mouse.from_center.scale(0) } );  
    }
  show_explanation( document_element ) { }
  make_control_panel()                                                        // This function of a scene sets up its keyboard shortcuts.
    { const globals = this.globals;
      this.control_panel.innerHTML += "Click and drag the scene to <br> spin your viewpoint around it.<br>";
      this.key_triggered_button( "Up",     [ " " ], () => this.thrust[1] = -1, undefined, () => this.thrust[1] = 0 );
      this.key_triggered_button( "Forward",[ "w" ], () => this.thrust[2] =  1, undefined, () => this.thrust[2] = 0 );  this.new_line();
      this.key_triggered_button( "Left",   [ "a" ], () => this.thrust[0] =  1, undefined, () => this.thrust[0] = 0 );
      this.key_triggered_button( "Back",   [ "s" ], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0 );
      this.key_triggered_button( "Right",  [ "d" ], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0 );  this.new_line();
      this.key_triggered_button( "Down",   [ "z" ], () => this.thrust[1] =  1, undefined, () => this.thrust[1] = 0 ); 

      const speed_controls = this.control_panel.appendChild( document.createElement( "span" ) );
      speed_controls.style.margin = "30px";
      this.key_triggered_button( "-",  [ "o" ], () => this.speed_multiplier  /=  1.2, "green", undefined, undefined, speed_controls );
      this.live_string( box => { box.textContent = "Speed: " + this.speed_multiplier.toFixed(2) }, speed_controls );
      this.key_triggered_button( "+",  [ "p" ], () => this.speed_multiplier  *=  1.2, "green", undefined, undefined, speed_controls );
      this.new_line();
      this.key_triggered_button( "Roll left",  [ "," ], () => this.roll =  1, undefined, () => this.roll = 0 );
      this.key_triggered_button( "Roll right", [ "." ], () => this.roll = -1, undefined, () => this.roll = 0 );  this.new_line();
      this.key_triggered_button( "(Un)freeze mouse look around", [ "f" ], () => this.look_around_locked ^=  1, "green" );
      this.new_line();
      this.live_string( box => box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2) 
                                                       + ", " + this.pos[2].toFixed(2) );
      this.new_line();        // The facing directions are actually affected by the left hand rule:
      this.live_string( box => box.textContent = "Facing: " + ( ( this.z_axis[0] > 0 ? "West " : "East ")
                   + ( this.z_axis[1] > 0 ? "Down " : "Up " ) + ( this.z_axis[2] > 0 ? "North" : "South" ) ) );
      this.new_line();     
      this.key_triggered_button( "Go to world origin", [ "r" ], () => this.target().set_identity( 4,4 ), "orange" );  this.new_line();
      this.key_triggered_button( "Attach to global camera", [ "Shift", "R" ], () => 
                                          globals.movement_controls_target = () => globals.graphics_state.camera_transform, "blue" );
      this.new_line();
    }
  first_person_flyaround( radians_per_frame, meters_per_frame, leeway = 70 )
    { const sign = this.will_invert ? 1 : -1;
      const do_operation = this.target()[ this.will_invert ? "pre_multiply" : "post_multiply" ].bind( this.target() );
                                                                      // Compare mouse's location to all four corners of a dead box.
      const offsets_from_dead_box = { plus: [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ],
                                     minus: [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ] }; 
                // Apply a camera rotation movement, but only when the mouse is past a minimum distance (leeway) from the canvas's center:
      if( !this.look_around_locked ) 
        for( let i = 0; i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't 
        {                                 // start increasing until outside a leeway window from the center.
          let o = offsets_from_dead_box,                                          // The &&'s in the next line might zero the vectors out:
            velocity = ( ( o.minus[i] > 0 && o.minus[i] ) || ( o.plus[i] < 0 && o.plus[i] ) ) * radians_per_frame;
          do_operation( Mat4.rotation( sign * velocity, Vec.of( i, 1-i, 0 ) ) );   // On X step, rotate around Y axis, and vice versa.
        }
      if( this.roll != 0 ) do_operation( Mat4.rotation( sign * .1, Vec.of(0, 0, this.roll ) ) );
                                                  // Now apply translation movement of the camera, in the newest local coordinate frame.
      do_operation( Mat4.translation( this.thrust.times( sign * meters_per_frame ) ) );
    }
  third_person_arcball( radians_per_frame )
    { const sign = this.will_invert ? 1 : -1;
      const do_operation = this.target()[ this.will_invert ? "pre_multiply" : "post_multiply" ].bind( this.target() );
      const dragging_vector = this.mouse.from_center.minus( this.mouse.anchor );               // Spin the scene around a point on an
      if( dragging_vector.norm() <= 0 ) return;                                                // axis determined by user mouse drag.
      do_operation( Mat4.translation([ 0,0, sign *  25 ]) );           // The presumed distance to the scene is a hard-coded 25 units.
      do_operation( Mat4.rotation( radians_per_frame * dragging_vector.norm(), Vec.of( dragging_vector[1], dragging_vector[0], 0 ) ) );
      do_operation( Mat4.translation([ 0,0, sign * -25 ]) );
    }
  display( graphics_state, dt = graphics_state.animation_delta_time / 1000 )    // Camera code starts here.
    { const m = this.speed_multiplier * this. meters_per_frame,
            r = this.speed_multiplier * this.radians_per_frame;
      this.first_person_flyaround( dt * r, dt * m );     // Do first-person.  Scale the normal camera aiming speed by dt for smoothness.
      if( this.mouse.anchor )                            // Also apply third-person "arcball" camera mode if a mouse drag is occurring.  
        this.third_person_arcball( dt * r);           
      
      const inv = Mat4.inverse( this.target() );
      this.pos = inv.times( Vec.of( 0,0,0,1 ) ); this.z_axis = inv.times( Vec.of( 0,0,1,0 ) );      // Log some values.
    }
}

window.Grid_Patch = window.classes.Grid_Patch =
class Grid_Patch extends Shape              // A grid of rows and columns you can distort. A tesselation of triangles connects the
{                                           // points, generated with a certain predictable pattern of indices.  Two callbacks
                                            // allow you to dynamically define how to reach the next row or column.
  constructor( rows, columns, next_row_function, next_column_function, texture_coord_range = [ [ 0, rows ], [ 0, columns ] ]  )
    { super( "positions", "normals", "texture_coords" );
      let points = [];
      for( let r = 0; r <= rows; r++ ) 
      { points.push( new Array( columns+1 ) );                                                    // Allocate a 2D array.
                                             // Use next_row_function to generate the start point of each row. Pass in the progress ratio,
        points[ r ][ 0 ] = next_row_function( r/rows, points[ r-1 ] && points[ r-1 ][ 0 ] );      // and the previous point if it existed.                                                                                                  
      }
      for(   let r = 0; r <= rows;    r++ )               // From those, use next_column function to generate the remaining points:
        for( let c = 0; c <= columns; c++ )
        { if( c > 0 ) points[r][ c ] = next_column_function( c/columns, points[r][ c-1 ], r/rows );
      
          this.positions.push( points[r][ c ] );        
                                                                                      // Interpolate texture coords from a provided range.
          const a1 = c/columns, a2 = r/rows, x_range = texture_coord_range[0], y_range = texture_coord_range[1];
          this.texture_coords.push( Vec.of( ( a1 )*x_range[1] + ( 1-a1 )*x_range[0], ( a2 )*y_range[1] + ( 1-a2 )*y_range[0] ) );
        }
      for(   let r = 0; r <= rows;    r++ )            // Generate normals by averaging the cross products of all defined neighbor pairs.
        for( let c = 0; c <= columns; c++ )
        { let curr = points[r][c], neighbors = new Array(4), normal = Vec.of( 0,0,0 );          
          for( let [ i, dir ] of [ [ -1,0 ], [ 0,1 ], [ 1,0 ], [ 0,-1 ] ].entries() )         // Store each neighbor by rotational order.
            neighbors[i] = points[ r + dir[1] ] && points[ r + dir[1] ][ c + dir[0] ];        // Leave "undefined" in the array wherever
                                                                                              // we hit a boundary.
          for( let i = 0; i < 4; i++ )                                          // Take cross-products of pairs of neighbors, proceeding
            if( neighbors[i] && neighbors[ (i+1)%4 ] )                          // a consistent rotational direction through the pairs:
              normal = normal.plus( neighbors[i].minus( curr ).cross( neighbors[ (i+1)%4 ].minus( curr ) ) );          
          normal.normalize();                                                              // Normalize the sum to get the average vector.
                                                     // Store the normal if it's valid (not NaN or zero length), otherwise use a default:
          if( normal.every( x => x == x ) && normal.norm() > .01 )  this.normals.push( Vec.from( normal ) );    
          else                                                      this.normals.push( Vec.of( 0,0,1 )    );
        }   
        
      for( var h = 0; h < rows; h++ )             // Generate a sequence like this (if #columns is 10):  
        for( var i = 0; i < 2 * columns; i++ )    // "1 11 0  11 1 12  2 12 1  12 2 13  3 13 2  13 3 14  4 14 3..." 
          for( var j = 0; j < 3; j++ )
            this.indices.push( h * ( columns + 1 ) + columns * ( ( i + ( j % 2 ) ) % 2 ) + ( ~~( ( j % 3 ) / 2 ) ? 
                                   ( ~~( i / 2 ) + 2 * ( i % 2 ) )  :  ( ~~( i / 2 ) + 1 ) ) );
    }
  static sample_array( array, ratio )                 // Optional but sometimes useful as a next row or column operation. In a given array
    {                                                 // of points, intepolate the pair of points that our progress ratio falls between.  
      const frac = ratio * ( array.length - 1 ), alpha = frac - Math.floor( frac );
      return array[ Math.floor( frac ) ].mix( array[ Math.ceil( frac ) ], alpha );
    }
}

window.Surface_Of_Revolution = window.classes.Surface_Of_Revolution =
class Surface_Of_Revolution extends Grid_Patch      // SURFACE OF REVOLUTION: Produce a curved "sheet" of triangles with rows and columns.
                                                    // Begin with an input array of points, defining a 1D path curving through 3D space -- 
                                                    // now let each such point be a row.  Sweep that whole curve around the Z axis in equal 
                                                    // steps, stopping and storing new points along the way; let each step be a column. Now
                                                    // we have a flexible "generalized cylinder" spanning an area until total_curvature_angle.
{ constructor( rows, columns, points, texture_coord_range, total_curvature_angle = 2*Math.PI )
    { const row_operation =     i => Grid_Patch.sample_array( points, i ),
         column_operation = (j,p) => Mat4.rotation( total_curvature_angle/columns, Vec.of( 0,0,1 ) ).times(p.to4(1)).to3();
         
       super( rows, columns, row_operation, column_operation, texture_coord_range );
    }
}

window.Torus = window.classes.Torus =
class Torus extends Shape                                         // Build a donut shape.  An example of a surface of revolution.
  { constructor( rows, columns )  
      { super( "positions", "normals", "texture_coords" );
        const circle_points = Array( rows ).fill( Vec.of( .75,0,0 ) )
                                           .map( (p,i,a) => Mat4.translation([ -2,0,0 ])
                                                    .times( Mat4.rotation( i/(a.length-1) * 2*Math.PI, Vec.of( 0,-1,0 ) ) )
                                                    .times( p.to4(1) ).to3() );

        Surface_Of_Revolution.insert_transformed_copy_into( this, [ rows, columns, circle_points ] );         
      } }
