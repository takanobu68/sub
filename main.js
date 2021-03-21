function main() {
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true
	});

	const fov = 60;
	const aspect = 2;  // the canvas default
	const near = 0.1;
	const far = 200;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 30;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xffffff);
	// const pickingScene = new THREE.Scene();
	// pickingScene.background = new THREE.Color(0);

	//カメラをポールに置きます（オブジェクトの親になります）
	//ポールを回転させて、シーン内でカメラを動かすことができます
	const cameraPole = new THREE.Object3D();
	scene.add(cameraPole);
	cameraPole.add(camera);
	// console.log(cameraPole.children)

	{
		const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-1, 2, 4);
		//カメラにライトを当てて、ライトが一緒に動くようにします。
		camera.add(light);
	}

	const boxWidth = 1;
	const boxHeight = 1;
	const boxDepth = 1;
	const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

	function rand(min, max) {
		if (max === undefined) {
			max = min;
			min = 0;
		}
		return min + (max - min) * Math.random();
	}

	function randomColor() {
		return `hsl(${rand(360) | 0}, ${rand(50, 100) | 0}%, 50%)`;
	}

	const loader = new THREE.TextureLoader();
	const texture = loader.load('./frame.png');

	const numObjects = 100;

	for (let i = 0; i < numObjects; ++i) {
		const material = new THREE.MeshPhongMaterial({
			color: randomColor(),
			map: texture,
			transparent: true,
			side: THREE.DoubleSide,
			alphaTest: 0.1,
		});

		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
		cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
		cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));
	}
	function resizeRendererToDisplaySize(renderer) {
		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize) {
			renderer.setSize(width, height, false);
		}
		return needResize;
	}
	class PickHelper {
		constructor() {
			this.raycaster = new THREE.Raycaster();
			this.pickedObject = null;
			this.pickedObjectSavedColor = 0;
		}
		pick(normalizedPosition, scene, camera, time) {
			//選択したオブジェクトがある場合は色を復元します
			if (this.pickedObject) {
				this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
				this.pickedObject = undefined;
			}

			//錐台に光線を当てます
			this.raycaster.setFromCamera(normalizedPosition, camera);
			//光線が交差したオブジェクトのリストを取得します
			const intersectedObjects = this.raycaster.intersectObjects(scene.children);
			if (intersectedObjects.length) {
				//最初のオブジェクトを選択します。一番近いです
				this.pickedObject = intersectedObjects[0].object;
				//その色を保存します
				this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
				//発光色を赤/黄色の点滅に設定します
				this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
			}
		}
	}

	const pickPosition = { x: 0, y: 0 };
	const pickHelper = new PickHelper();
	clearPickPosition();

	function render(time) {
		time *= 0.001;  // convert to seconds;

		if (resizeRendererToDisplaySize(renderer)) {
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}

		cameraPole.rotation.y = time * .1;

		pickHelper.pick(pickPosition, scene, camera, time);

		renderer.render(scene, camera);

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);

	function getCanvasRelativePosition(event) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: (event.clientX - rect.left) * canvas.width / rect.width,
			y: (event.clientY - rect.top) * canvas.height / rect.height,
		};
	}

	function setPickPosition(event) {
		const pos = getCanvasRelativePosition(event);
		pickPosition.x = (pos.x / canvas.width) * 2 - 1;
		pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
	}

	function clearPickPosition() {
		//常に位置があるマウスとは異なり
		//ユーザーが必要な画面へのタッチを停止した場合
		//ピッキングを停止します。今のところ、値を選択するだけです
		//何かを選ぶ可能性は低い
		pickPosition.x = -100000;
		pickPosition.y = -100000;
	}
	window.addEventListener('mousemove', setPickPosition);
	window.addEventListener('mouseout', clearPickPosition);
	window.addEventListener('mouseleave', clearPickPosition);

	window.addEventListener('touchstart', (event) => {
		// prevent the window from scrolling
		event.preventDefault();
		setPickPosition(event.touches[0]);
	}, { passive: false });

	window.addEventListener('touchmove', (event) => {
		setPickPosition(event.touches[0]);
	});

	window.addEventListener('touchend', clearPickPosition);
}


main();
