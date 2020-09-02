var canvas; // 画布对象
var gl; // WebGL对象
var program; // 着色器对象

// Uniform对象
var uOffset, uView, uProjection, uTransform1, uTransform2, uTransform3;

// 顶点数据
var points = [
    vec2(-0.5, -0.28),
    vec2(-0.5, 0.28),
    vec2(0.5, 0.28),
    vec2(-0.5, -0.28),
    vec2(0.5, 0.28),
    vec2(0.5, -0.28),
    
    vec2(1.5, -0.28),
    vec2(1.5, 0.28),
    vec2(2.5, 0.28),
    vec2(1.5, -0.28),
    vec2(2.5, 0.28),
    vec2(2.5, -0.28),

    vec2(3.5, -0.28),
    vec2(3.5, 0.28),
    vec2(4.5, 0.28),
    vec2(3.5, -0.28),
    vec2(4.5, 0.28),
    vec2(4.5, -0.28),
];

var colors = [
    vec3(1, 0, 0),
    vec3(1, 0, 0),
    vec3(1, 0, 0),
    vec3(1, 0, 0),
    vec3(1, 0, 0),
    vec3(1, 0, 0),

    vec3(0, 1, 0),
    vec3(0, 1, 0),
    vec3(0, 1, 0),
    vec3(0, 1, 0),
    vec3(0, 1, 0),
    vec3(0, 1, 0),

    vec3(0, 0, 1),
    vec3(0, 0, 1),
    vec3(0, 0, 1),
    vec3(0, 0, 1),
    vec3(0, 0, 1),
    vec3(0, 0, 1),
];

var texIndices = [
    1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3
];

var texCoords = [
	vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(0, 0),
	vec2(1, 1),
    vec2(1, 0), 
    
    vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(0, 0),
	vec2(1, 1),
    vec2(1, 0), 
    
    vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(0, 0),
	vec2(1, 1),
	vec2(1, 0), 
];

var mouseOffset = vec2(0.0, 0.0);
var eye = vec3(0.0, 0.0, 0.0), at = vec3(0.0, 0.0, 0.0);

var transformMat1, transformMat2, transformMat3

/* window.onload在网页加载完成时调用 */
window.onload = function() {
    //
    // 获取画布和WebGL对象
    //
    canvas = document.getElementById( "canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL不可用！" ); }
    
    //
    // 设置画布
    //
    canvas.width = document.body.clientWidth;   // 获取画布宽度       
    canvas.height = document.body.clientHeight; // 获取画布高度  
    gl.viewport( 0, 0, canvas.width, canvas.height );// 设置视口大小同画布大小    
    gl.enable(gl.DEPTH_TEST); // 设置深度缓存，画多边形面图元时需要
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置背景色          
    gl.clear( gl.COLOR_BUFFER_BIT );  // 用背景色填充帧缓存

    //
    // 读取着色器
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" ); // 从html中读取顶点着色器和片元着色器
    gl.useProgram( program ); // 使用该着色器

    //
    // 加载纹理
    // 
    setTexture();
    
    // 
    // 初始化属性缓冲，这里包括了 顶点位置数组pointBuffer 和 顶点颜色数组colorBuffer
    // 
    var pointBuffer = gl.createBuffer(); // 创建一个缓冲
    gl.bindBuffer( gl.ARRAY_BUFFER, pointBuffer); // 绑定缓冲，这激活了缓冲，并指定了该缓冲的作用
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW ); // 创建缓冲，这里没有传入数据
    var vPosition = gl.getAttribLocation(program, "vPosition" ); // 获取着色器属性
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 ) ; // 设置着色器属性的数据类型，这里4, FLOAT相当于vec4
    gl.enableVertexAttribArray( vPosition ); // 指定该属性使用刚才绑定的缓冲
    // 若对以上函数有疑问，可以在https://developer.mozilla.org/zh-CN/ 查看说明
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var texIndexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, texIndexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texIndices), gl.STATIC_DRAW );
    var vTexIndex = gl.getAttribLocation( program, "vTexIndex" );
    gl.vertexAttribPointer( vTexIndex, 1, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexIndex );

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, texCoordBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    // 
    // 初始化uniform变量
    // 
    uOffset = gl.getUniformLocation(program, "offset");
    uView = gl.getUniformLocation(program, "view");
    uProjection = gl.getUniformLocation(program, "projection");
    uTransform1 = gl.getUniformLocation(program, "transform1");
    uTransform2 = gl.getUniformLocation(program, "transform2");
    uTransform3 = gl.getUniformLocation(program, "transform3");

    resize();
    render();
}

var cFrame = 0;

/* 渲染函数 */
function render(){
    // 计算镜头偏移
    eye[0] = eye[0] * 0.9 + cImgIndex * 0.2 + mouseOffset[0];
    eye[1] = eye[1]* 0.9 + mouseOffset[1];
    eye[2] = 1;
    at[0] = at[0] * 0.9 + cImgIndex * 0.2;
    at[1] = 0;
    at[2] = 0;
    // 图片变换
    animation();
    var projection = perspective( 70, 16/9, -1, 1 );
    var view = lookAt(eye, at, vec3(0, 1, 0));
    var transformMat1 = mult(rotate(angelXaxis1, vec3(1, 0, 0)), rotate(angelYaxis1, vec3(0, 1, 0))); // 单位矩阵
    var transformMat2 = mult(translate(2, 0, 0), mult(rotate(angelZaxis2, vec3(0, 0, -1)), translate(-2, 0, 0)));
    var transformMat3 = translate(Math.cos(theta3)/10 + Math.cos(theta3*2)/10 + Math.cos(theta3*3)/10, Math.sin(theta3)/10+Math.sin(theta3*5)/20, 0);
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.uniformMatrix4fv( uView, false, flatten(view) );
    gl.uniformMatrix4fv( uProjection, false, flatten(projection) );
    gl.uniformMatrix4fv( uTransform1, false, flatten(transformMat1) );
    gl.uniformMatrix4fv( uTransform2, false, flatten(transformMat2) );
    gl.uniformMatrix4fv( uTransform3, false, flatten(transformMat3) );

    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    cFrame++;
    window.requestAnimFrame(render); 
}

/* 键盘按键事件 */
window.onkeydown = function(e){
    let code = e.keyCode;
    switch (code) {
        case 32:    // 空格-清屏并清空数据

        break;
    }

}

/* 窗口大小改变，绘图界面也改变 */
window.onresize = resize;
function resize(){
    // 保持16:9
    if (document.body.clientWidth / 16 * 9 > document.body.clientHeight){
        canvas.width = document.body.clientHeight / 9 * 16;
        canvas.height = document.body.clientHeight;
    }
    else{
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientWidth / 16 * 9;
    }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );    
    gl.clear( gl.COLOR_BUFFER_BIT );  //用背景色填充帧缓存
}

function setTexture(){    
    var image1 = document.getElementById("texture-1");
    var image2 = document.getElementById("texture-2");
    var image3 = document.getElementById("texture-3");
    loadTexture(image1, 0, gl.getUniformLocation(program, "textureSampler1"));
    loadTexture(image2, 1, gl.getUniformLocation(program, "textureSampler2"));
    loadTexture(image3, 2, gl.getUniformLocation(program, "textureSampler3"));
}

function loadTexture(image, index, uniform){
    
    
    texture1 = gl.createTexture();//创建纹理对象
    switch (index) {
        case 0:
            gl.activeTexture(gl.TEXTURE0);
            break;
        case 1:
            gl.activeTexture(gl.TEXTURE1);
            break;
        case 2:
            gl.activeTexture(gl.TEXTURE2);
            break;       
        default:
            break;
    }
    
    gl.bindTexture( gl.TEXTURE_2D, texture1 );//绑定为当前2D纹理对象    

    //把纹理对象从顶端翻转到底部（因APP和纹理图像用不同坐标系）
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);           
    //将图像数组image指定为当前二维纹理，即存到纹理内存    
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,gl.RGB, gl.UNSIGNED_BYTE, image );
    
    /*为当前纹理对象设置属性参数，控制纹理映射到物体表面的方式*/    
    gl.generateMipmap( gl.TEXTURE_2D );        
    //gl.TEXTURE_MIN_FILTER：像素比纹素大，单个像素对应多个纹素，纹理需要缩小,
    //gl.NEAREST_MIPMAP_LINEAR：采用点采样方式得到相邻的Mipmap纹理， 并且在得到的Mipmap纹理内部使用线性滤波。
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.NEAREST_MIPMAP_LINEAR );    
    //gl.TEXTURE_MAG_FILTER：像素比纹素小，多个像素对应单个纹素，纹理需要放大。
    //gl.NEAREST :采用点采样方式得纹理
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.TEXTURE_MAG_FILTER );
    
    /*关联当前纹理对象和片元SHADER中的采样器对象sampler*/
    gl.uniform1i(uniform, index);
}

// fps计算
var fpsCounter = setInterval(function(){
    var fpsText = document.getElementById("fps");
    fpsText.innerHTML = "帧数：" + cFrame + " FPS";
    cFrame = 0;
}, 1000)


window.addEventListener("mousemove", function(e){
    mouseOffset[0] = -(e.clientX/document.body.clientWidth - 0.5) / 10;
    mouseOffset[1] = (e.clientY/document.body.clientHeight - 0.5) / 10;
})

var cImgIndex = 0;
function switchImg(step){
    cImgIndex = Math.max(0, Math.min(2, cImgIndex + step));
}


var angelXaxis1 = 0, angelYaxis1 = 0;
var angelZaxis2 = 0;
var theta3 = 0;
function animation(){
    var time = new Date().getTime();
    angelXaxis1 = Math.sin(time / 800 ) * 20;
    angelYaxis1 = Math.sin(time / 400 + Math.PI/2) * 40;
    angelZaxis2 = time / 100;
    theta3 = time / 800;
}