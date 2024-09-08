'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

export default function Camera() {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
	const [isFrontCamera, setIsFrontCamera] = useState(true)
	const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1'>('9:16')
	const [modeLabel, setModeLabel] = useState('Stories')
	const [selectedFrame, setSelectedFrame] = useState<string>('/assets/frames/9x16/1.png')

	const isPWA = () => {
		return (
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true ||
			document.referrer.includes('android-app://') ||
			document.referrer.includes('ios-app://')
		)
	}

	const startCamera = useCallback(() => {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices
				.getUserMedia({ video: { facingMode: isFrontCamera ? 'user' : 'environment' } })
				.then((stream) => {
					if (videoRef.current) {
						videoRef.current.srcObject = stream
						videoRef.current.play().catch((error) => console.error('Erro ao reproduzir o vídeo: ', error))
					}
				})
				.catch((err) => {
					console.error('Erro ao acessar a câmera: ', err)
				})
		}
	}, [isFrontCamera])

	useEffect(() => {
		startCamera()
		if (!photoDataUrl && videoRef.current && videoRef.current.srcObject) videoRef.current.play().catch((error) => console.error('Erro ao reproduzir o vídeo: ', error))
	}, [photoDataUrl, isFrontCamera])

	useEffect(() => {
		const handleVisibilityChange = () => document.visibilityState === 'visible' && !photoDataUrl && startCamera()
		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
	}, [photoDataUrl])

	useEffect(() => {
		setSelectedFrame(`/assets/frames/${aspectRatio.replace(':', 'x')}/1.png`)
	}, [aspectRatio])

	const drawImageOnCanvas = useCallback(
		(imageSource: string) => {
			if (canvasRef.current) {
				const canvas = canvasRef.current
				const context = canvas.getContext('2d')
				const frame = document.getElementById('frame') as HTMLImageElement
				const image = new Image()

				image.onload = () => {
					const targetWidth = 1080
					const targetHeight = aspectRatio === '9:16' ? 1920 : 1080

					canvas.width = targetWidth
					canvas.height = targetHeight

					const imageAspectRatio = image.width / image.height
					let drawWidth = canvas.width
					let drawHeight = canvas.height

					if (imageAspectRatio > targetWidth / targetHeight) {
						drawWidth = canvas.height * imageAspectRatio
						context?.drawImage(image, (canvas.width - drawWidth) / 2, 0, drawWidth, drawHeight)
					} else {
						drawHeight = canvas.width / imageAspectRatio
						context?.drawImage(image, 0, (canvas.height - drawHeight) / 2, drawWidth, drawHeight)
					}

					if (frame) context?.drawImage(frame, 0, 0, canvas.width, canvas.height)

					const dataUrl = canvas.toDataURL('image/png')
					setPhotoDataUrl(dataUrl)
				}

				image.src = imageSource
			}
		},
		[aspectRatio],
	)

	const takePhoto = () => {
		if (videoRef.current) {
			const canvas = canvasRef.current
			const context = canvas?.getContext('2d')

			const video = videoRef.current
			const frame = document.getElementById('frame') as HTMLImageElement

			const targetWidth = 1080
			const targetHeight = aspectRatio === '9:16' ? 1920 : 1080

			canvas!.width = targetWidth
			canvas!.height = targetHeight

			const videoAspectRatio = video.videoWidth / video.videoHeight
			let drawWidth = canvas!.width
			let drawHeight = canvas!.height

			if (videoAspectRatio > targetWidth / targetHeight) {
				drawWidth = canvas!.height * videoAspectRatio
				context?.drawImage(video, (canvas!.width - drawWidth) / 2, 0, drawWidth, drawHeight)
			} else {
				drawHeight = canvas!.width / videoAspectRatio
				context?.drawImage(video, 0, (canvas!.height - drawHeight) / 2, drawWidth, drawHeight)
			}

			if (frame) context?.drawImage(frame, 0, 0, canvas!.width, canvas!.height)

			const dataUrl = canvas!.toDataURL('image/png')
			setPhotoDataUrl(dataUrl)
		}
	}

	const loadImageFromGallery = useCallback(() => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.onchange = (event: any) => {
			const file = event.target.files[0]
			if (file) {
				const reader = new FileReader()
				reader.onload = () => {
					const originalAspectRatio = aspectRatio // Preserve o estado original
					drawImageOnCanvas(reader.result as string)
					setAspectRatio(originalAspectRatio) // Restaura o estado após carregar a imagem
				}
				reader.readAsDataURL(file)
			} else {
				console.log('Nenhum arquivo foi selecionado.')
			}
		}
		input.click()
	}, [aspectRatio, drawImageOnCanvas])

	const toggleCamera = useCallback(() => {
		setIsFrontCamera((prev) => !prev)
	}, [])

	const toggleMode = () => {
		if (aspectRatio === '9:16') {
			setAspectRatio('1:1')
			setModeLabel('Feed')
			setSelectedFrame(selectedFrame.replace('9-16', '1-1'))
		} else {
			setAspectRatio('9:16')
			setModeLabel('Stories')
			setSelectedFrame(selectedFrame.replace('1-1', '9-16'))
		}
	}

	const savePhotoToGallery = async (photoDataUrl: any) => {
		if (videoRef.current && videoRef.current.srcObject) {
			const tracks = (videoRef as any).current.srcObject.getTracks()
			tracks.forEach((track: any) => track.stop())
		}

		if ('showSaveFilePicker' in window) {
			try {
				const handle = await (window as any).showSaveFilePicker({
					suggestedName: 'Compartilhe nas redes sociais.png',
					types: [
						{
							description: 'Estou demonstrando meu apoio a Assis!',
							accept: { 'image/png': ['.png'] },
						},
					],
				})
				const writable = await handle.createWritable()
				await writable.write(await (await fetch(photoDataUrl)).blob())
				await writable.close()
				alert('A foto foi salva na galeria!')

				return true
			} catch (err: any) {
				console.error('Erro ao salvar a imagem na galeria:', err)
				if (err.name === 'NotAllowedError') return false
			}
		} else {
			return false
		}
	}

	const savePhotoToDownloads = async (photoDataUrl: any) => {
		const link = document.createElement('a')
		link.href = photoDataUrl
		link.download = 'Compartilhe nas redes sociais.png'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		setPhotoDataUrl(null)

		alert('A foto foi salva na pasta "Downloads". Mova-a manualmente para a galeria se desejar.')
	}

	const savePhoto = async () => {
		if (photoDataUrl) {
			if (isPWA()) {
				const saved = await savePhotoToGallery(photoDataUrl)
				if (saved === false) savePhotoToDownloads(photoDataUrl)
			} else {
				savePhotoToDownloads(photoDataUrl)
			}
		}
	}

	const retakePhoto = () => {
		setPhotoDataUrl(null)
	}

	useEffect(() => {
		const handleWheel = (event: WheelEvent) => {
			if (event.ctrlKey) {
				event.preventDefault()
			}
		}

		document.addEventListener('wheel', handleWheel, { passive: false })

		return () => {
			document.removeEventListener('wheel', handleWheel)
		}
	}, [])

	return (
		<div className="w-full flex items-center justify-center flex-col no-scrollbar overflow-y-auto min-h-[calc(100dvh)] max-h-[calc(100dvh)]">
			{!photoDataUrl ? (
				<div className="w-full flex items-center justify-center md:max-w-[720px]">
					<div className="relative w-screen flex items-center justify-center transition-all duration-300 video-transition">
						<div
							className={`relative flex items-center justify-center bg-black transition-all duration-300 video-transition ${
								aspectRatio === '9:16' ? 'w-full h-full' : 'w-full h-[100vw] max-h-full'
							} ${photoDataUrl ? 'hidden' : 'visible'}`}
							style={aspectRatio === '1:1' ? { paddingBottom: '100%' } : { paddingBottom: '177.77%' }}>
							<video
								ref={videoRef}
								className="absolute top-0 left-0 w-full h-full object-cover transform data-[is-front-camera=true]:-scale-x-100 z-10 transition-all duration-300 video-transition"
								autoPlay
								playsInline
								muted
								data-is-front-camera={isFrontCamera}
							/>
						</div>
						<div className="absolute inset-0 pointer-events-none z-20 transition-all duration-300 video-transition">
							<img
								id="frame"
								src={selectedFrame}
								alt="Moldura Selecionada"
								className="w-full h-full data-[is-square=true]:object-contain object-fill transition-all duration-300 video-transition"
								data-is-square={aspectRatio === '1:1'}
							/>
						</div>
						<div
							className="absolute top-10 left-1/2 transform -translate-x-1/2 backdrop-blur-lg bg-opacity-30 bg-black text-white px-4 py-1.5 rounded-3xl z-50 transition-all duration-300 video-transition"
							onClick={() => {
								setTimeout(() => {
									toggleMode()
								}, 150)
							}}>
							{modeLabel}
						</div>
						<div
							className="absolute data-[is-square=true]:bottom-[170px] bottom-32 flex space-x-4 w-full px-10 z-50 justify-center outline-none transition-all duration-300 video-transition"
							data-is-square={aspectRatio === '1:1'}>
							<div className="flex space-x-3 p-3 z-50 rounded-3xl backdrop-blur-lg bg-opacity-30 bg-black text-white px-4 py-3 transition-all duration-300 video-transition outline-none">
								{['1', '2', '3', '4', '5', '6'].map((frameNumber) => (
									<img
										key={frameNumber}
										src={`/assets/frames/icons/${frameNumber}.png`}
										alt={`Moldura ${frameNumber}`}
										className={`outline-none w-10 h-10 object-contain cursor-pointer rounded-full ${
											selectedFrame.includes(`${frameNumber}.png`)
												? 'border-4 border-white rounded-full transition-all duration-300 video-transition'
												: 'transition-all duration-300 video-transition'
										}`}
										onClick={() => setSelectedFrame(`/assets/frames/${aspectRatio === '9:16' ? '9x16' : '1x1'}/${frameNumber}.png`)}
									/>
								))}
							</div>
						</div>
						<div className="absolute bottom-10 flex justify-between w-full px-10 max-w-[320px]">
							<button
								title="Importar da Galeria"
								type="button"
								onClick={loadImageFromGallery}
								className="p-2.5 w-12 h-12 bg-black rounded-full text-black text-xl flex items-center justify-center z-30 backdrop-blur-3xl bg-opacity-30 transition-all duration-300 video-transition">
								<img src="/assets/icons/gallery.svg" width="50" height="50" alt="Importar da Galeria" />
							</button>
							<button
								title="Fotografar"
								type="button"
								onClick={takePhoto}
								className="w-16 h-16 bg-black border-2 border-white rounded-full text-black text-2xl flex items-center justify-center z-30 backdrop-blur-3xl bg-opacity-30 transition-all duration-300 video-transition"></button>
							<button
								title="Trocar câmera"
								type="button"
								onClick={toggleCamera}
								className="p-2.5 w-12 h-12 bg-black rounded-full text-black text-xl flex items-center justify-center z-30 backdrop-blur-3xl bg-opacity-30 transition-all duration-300 video-transition">
								<img src="/assets/icons/switch.svg" width="50" height="50" alt="Trocar câmera" />
							</button>
						</div>
						<canvas ref={canvasRef} className="hidden"></canvas>
					</div>
				</div>
			) : (
				<>
					<div className="flex flex-col items-center justify-evenly transition-all duration-300 video-transition">
						<div className="w-full h-2 fixed top-0 z-50 bg-[#FDD506] flex">
							<div className="w-[15%] bg-[#F89D1C] h-2 rounded-r-xl -ml-1 z-30" />
							<div className="w-[10%] bg-[#ED2B79] h-2 rounded-r-xl -ml-1 z-20" />
							<div className="w-[20%] bg-[#3CB670] h-2 rounded-r-xl -ml-1 z-10" />
							<div className="w-[40%] bg-[#4373B7] h-2 rounded-r-xl -ml-1" />
						</div>
						<div className="w-full flex flex-col items-center justify-between pt-16 px-8">
							<img src="/assets/logo.svg" alt="Prefeito Assis | Vice-Prefeita Perpétua | 13" width="200" className="mb-6" />
							<div className="bg-white rounded-3xl p-10 mt-12 flex flex-col max-w-[440px] px-16 mb-16">
								<img src={photoDataUrl} alt="Captured" width="100%" className="rounded-lg" />
								<div className="relative flex flex-col w-full gap-4 mt-4">
									<button
										onClick={savePhoto}
										className="w-full py-5 bg-green-500 text-white flex items-center justify-center z-30 transition-all duration-300 video-transition rounded-xl">
										Ficou bom!
									</button>
									<button
										onClick={retakePhoto}
										className="w-full py-5 bg-red-500 text-white flex items-center justify-center z-30 transition-all duration-300 video-transition rounded-xl">
										Tirar outra foto
									</button>
								</div>
							</div>
						</div>
					</div>
					<img src="/assets/footer-city.svg" alt="Rodapé" width="100%" />
				</>
			)}
		</div>
	)
}
