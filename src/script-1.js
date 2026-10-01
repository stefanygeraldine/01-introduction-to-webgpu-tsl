import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import {
    vec3,
    sin,
    checker,
    uv,
    vec2,
    vec4,
    mul,
    floor,
    rotate,
    rand,
    time,
    float,
    texture,
    positionLocal,
    mx_noise_vec3,
    vertexStage,
    normalLocal,
    positionWorld, normalView, hash, mx_noise_float, rotateUV, triplanarTexture
} from 'three/tsl'


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.threejs')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 5
camera.position.y = 4.5
camera.position.z = 2.5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGPURenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x111111)

/**
 * Floor
 */

    // const texture = textureLoader.load('./floor-color.jpg')
const uvChecker = textureLoader.load('./uvChecker.png')
uvChecker.colorSpace = THREE.SRGBColorSpace
uvChecker.wrapS = THREE.MirroredRepeatWrapping
uvChecker.wrapT = THREE.MirroredRepeatWrapping
uvChecker.repeat.set(3,3)
// uvChecker.rotation = 1
{


    const geometry =  new THREE.PlaneGeometry(10, 10, 64, 64);

    const material =  new THREE.MeshStandardNodeMaterial({
       // map: texture,
        transparent: true,
       // wireframe: true
    });

    material.colorNode = texture(
        uvChecker,
        rotateUV(uv().mul(3), -1, vec2(0))
    )

    const fade = uv().sub(0.5).length().smoothstep(0.5,0.2)
    material.opacityNode = fade

    const noise = vertexStage(mx_noise_vec3(uv().mul(4)));
   // const noise = mx_noise_vec3(uv().mul(4)).toVertexStage;
    //const noise = mx_noise_vec3(uv().mul(4)).toVarying('test-varying');
    //material.colorNode = noise


    const mesh = new THREE.Mesh(geometry, material)

    mesh.rotation.x = - Math.PI * 0.5
    mesh.receiveShadow = true
    scene.add(mesh)
}

/**
 * Dummy
 */
{
    const geometry = new THREE.TorusKnotGeometry(0.5, 0.24, 128, 32)
    //const geometry = new THREE.SphereGeometry(0.5,12,16)
    const material = new THREE.MeshStandardNodeMaterial();

    // material.outputNode = vec4(positionLocal, 1)
    // material.outputNode = vec4(normalView, 1)
    // const pattern = hash(uv().x.mul(100))
    const pattern = rand(uv().mul(100).floor())
   // const noise = mx_noise_float(uv().mul(vec2(50,10)))
    //material.colorNode = vec3(pattern)
    material.colorNode = triplanarTexture(
        texture(uvChecker),
        null,
        null,
        float(2),
        positionLocal,
        normalLocal
    )

    const angle = time.add(positionLocal.y).sin()
    const newXZ = rotate(positionLocal.xz, angle)

    // material.positionNode = vec3( newXZ.x, positionLocal.y, newXZ.y )


    //const pattern = checker(uv().add(time.mul(0.02)).mul(vec2(40, 5)))
    //const foo = vec2(0.5, 1)
    //material.colorNode = vec3(foo, 0);
    //material.roughnessNode = pattern

    const zOffset = sin(time.add(positionLocal.y.mul(3))).mul(0.4);
   // material.positionNode = positionLocal.add(vec3(2,0,zOffset))

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.y = 1

    scene.add(mesh)


// TransformControl
    const transformControls = new TransformControls(camera, canvas)
    transformControls.attach(mesh)
    scene.add(transformControls.getHelper())

    transformControls.addEventListener('dragging-changed', (event) =>
    {
        controls.enabled = !event.value
    })

    window.addEventListener('keydown', (event) =>
    {
        if(event.key === 'g')
            transformControls.setMode('translate')
        else if(event.key === 'r')
            transformControls.setMode('rotate')
        else if(event.key === 's')
            transformControls.setMode('scale')
    })



}


/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5)
directionalLight.castShadow = true
directionalLight.position.set(2, 0.75, -1).normalize().multiplyScalar(10)
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.bottom = -10
directionalLight.shadow.camera.left = -10
directionalLight.shadow.camera.near = 0.01
directionalLight.shadow.camera.far = 20
directionalLight.shadow.radius = 3
directionalLight.shadow.normalBias = 0.1
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight(0x859dff, 1)
scene.add(ambientLight)

/**
 * Animate
 */
const timer = new THREE.Timer()
timer.connect(document)

const tick = () =>
{
    timer.update()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
   // window.requestAnimationFrame(tick)
}

renderer.setAnimationLoop(tick)

console.log(renderer.backend)