import React, { Component } from "react"
import { toNumber, isFinite, toInteger } from 'lodash'
import { remote } from 'electron'
import { gameRefreshPage } from 'views/services/utils'
import http from "http"
import url from "url"
//import images from "images"

const DEFAULT_WIDTH = 800
const PORT = 5277
const JPEG_QUALITY = 80

const {$, i18n, config} = window
const __ = i18n["poi-plugin-kcps-terminal"].__.bind(i18n["poi-plugin-kcps-terminal"])
const webview = $('kan-game webview')

//默认的返回内容
const responseHelloWorld = (response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	response.write("Hello World")
	response.end()
}

const responseDefault = (response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	//response.write("Ok")
	response.end()
}

const responseWrongParams = (response) => {
	response.statusCode = 400
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	//response.write("Wrong parameter")
	response.end()
}

const responseWrongPath = (response) => {
	response.statusCode = 404
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	//response.write("Page not found")
	response.end()
}

//提供的功能
const responseCapture = (request, response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "image/jpeg")
	const bound = webview.getBoundingClientRect()
	const rect = {
		x: Math.ceil(bound.left),
		y: Math.ceil(bound.top),
		width: Math.floor(bound.width),
		height: Math.floor(bound.height),
	}
	remote.getGlobal("mainWindow").capturePage(rect, (image) => {
			const buffer = image.toJPEG(JPEG_QUALITY)  //const buffer = images(image.toPNG()).resize(DEFAULT_WIDTH).encode("jpg", {operation: JPEG_QUALITY})
			response.write(buffer)
			response.end()
		})
}

const responseMouse = (request, response) => {
	let params = url.parse(request.url, true).query
	let type = params.type
	let x = params.x
	let y = params.y
	switch (type) {
		case "down":
			type = "mouseDown"
			break
		case "up":
			type = "mouseUp"
			break
		case "move":
			type = "mouseMove"
			break
		default:
			responseWrongParams(response)
			return
	}
	x = toNumber(x)
	y = toNumber(y)
	if (isFinite(x) && isFinite(y)) {
		let ratio = config.get('poi.webview.width', -1) / DEFAULT_WIDTH
		x = toInteger(x * ratio)
		y = toInteger(y * ratio)
		webview.sendInputEvent({type: type, x: x, y: y})
		responseDefault(response)
	} else {
		responseWrongParams(response)
	}
}

const responseRefresh = (response) => {
	gameRefreshPage()
	responseDefault(response)
}

//服务器
const onRequest = (request, response) => {
	let pathname = url.parse(request.url).pathname
	if (pathname === "/" || pathname === "/hello") {
		responseHelloWorld(response)
	} else if (pathname === "/capture") {
		responseCapture(request, response)
	} else if (pathname === "/mouse") {
		responseMouse(request, response)
	} else if (pathname === "/refresh") {
		responseRefresh(response)
	} else {
		responseWrongPath(response)
	}
}

let server = http.createServer(onRequest)

const startServer = () => {
	server.listen(PORT)
	console.log("KCPS server started at port " + PORT + ".")
}

const stopServer = () => {
	server.close()
	console.log("KCPS server stopped.")
}

export const pluginDidLoad = () => {
	startServer()
}

export const pluginWillUnload = () => {
	stopServer()
}