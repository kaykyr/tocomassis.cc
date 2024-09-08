'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

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
		<div className="w-full flex items-center justify-between flex-col min-h-[calc(100dvh)]">
			<div className="flex flex-col items-center justify-evenly transition-all duration-300 video-transition">
				<div className="w-full h-2 fixed top-0 z-50 bg-[#FDD506] flex">
					<div className="w-[15%] bg-[#F89D1C] h-2 rounded-r-xl -ml-1 z-30" />
					<div className="w-[10%] bg-[#ED2B79] h-2 rounded-r-xl -ml-1 z-20" />
					<div className="w-[20%] bg-[#3CB670] h-2 rounded-r-xl -ml-1 z-10" />
					<div className="w-[40%] bg-[#4373B7] h-2 rounded-r-xl -ml-1" />
				</div>
				<div className="w-full flex flex-col items-center justify-between pt-16 px-8">
					<img src="/assets/logo.svg" alt="Prefeito Assis | Vice-Prefeita Perpétua | 13" width="200" className="mb-6" />
					<div className="bg-white rounded-3xl p-10 mt-12 flex flex-col max-w-[440px] px-8 z-10">
						<div className="relative flex flex-col w-full gap-4 mt-4">
							<video
								ref={videoRef}
								className="top-0 left-0 w-full h-[25vh] object-cover transform data-[is-front-camera=true]:-scale-x-100 transition-all duration-300 video-transition bg-black rounded-xl"
								autoPlay
								playsInline
								muted
								data-is-front-camera={isFrontCamera}
							/>
							<Link
								href="/camera"
								type="button"
								onClick={savePhoto}
								className="w-full px-6 py-5 bg-[#3CB670] text-white flex flex-col items-center justify-center z-30 transition-all duration-300 video-transition rounded-xl">
								<img src="/assets/icons/camera.svg" alt="Demonstre seu apoio agora!" />
								Demonstre o seu apoio!
							</Link>
						</div>
					</div>
				</div>
			</div>
			<img src="/assets/footer-city.svg" alt="Rodapé" width="100%" />
			<div className="absolute z-1 bg-[#256E70] w-full bottom-0 p-3 flex flex-col items-center justify-center">
				<img src="/assets/footer-logo.svg" alt="Prefeito Assis | Vice-Prefeita Perpétua | 13" width="100" />
				<p className="text-center mt-6 text-xs">
					Todos os direitos reservados
					<br />
					CNPJ: 56.517.066/0001-08
				</p>
			</div>
		</div>
	)
}
