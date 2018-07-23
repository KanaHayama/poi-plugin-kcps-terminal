/////////////////////////////////////////////////////////////////////////
///                                                                   ///
///                            Utils                                  ///
///                                                                   ///
/////////////////////////////////////////////////////////////////////////

const EXTENSION_KEY = "poi-plugin-kcps-terminal"
const {$, i18n, config} = window
const __ = i18n[EXTENSION_KEY].__.bind(i18n[EXTENSION_KEY])

/////////////////////////////////////////////////////////////////////////
///                                                                   ///
///                        User Interface                             ///
///                                                                   ///
/////////////////////////////////////////////////////////////////////////

import React, { Component } from "react"
import { connect } from 'react-redux'
import { get } from 'lodash'
import { createSelector } from 'reselect'
import { configSelector } from 'views/utils/selectors'
import InplaceEdit from 'react-edit-inplace'

const DEFAULT_PORT = 5277
const DEFAULT_QUALITY = 80

const CONFIG_PATH_PORT = "plugin.kcpsTerminal.port"
const CONFIG_PATH_QUALITY = "plugin.kcpsTerminal.quality"

const kcpsTerminalConfigSelector = createSelector(
	configSelector,
	(config) => ({
		port: get(config, CONFIG_PATH_PORT, DEFAULT_PORT),
		quality: get(config, CONFIG_PATH_QUALITY, DEFAULT_QUALITY)
	})
)

const mapStateToProps = (state) => kcpsTerminalConfigSelector(state)

export class PluginKCPS extends Component {
	handlePortChanged = ({newPortText}) => {
		config.set(CONFIG_PATH_PORT, parseInt(newPortText, 10))
	}
	
	handleQualityChanged = ({newQualityText}) => {
		config.set(CONFIG_PATH_QUALITY, parseInt(newQualityText, 10))
	}
	
	render() {
		return (
			<div>
				<h1>{__("Port")}:</h1>
				<InplaceEdit
					validate={text => +text >= 0 && +text <= 65535}
					text={String(this.props.port)}
					paramName="newPortText"
					change={this.handlePortChanged}
					stopPropagation
				/>
				<h1>{__("JPEG Quality")}:</h1>
				<InplaceEdit
					validate={text => +text >= 0 && +text <= 100}
					text={String(this.props.quality)}
					paramName="newQualityText"
					change={this.handleQualityChanged}
					stopPropagation
				/>
			</div>
		)
	}
}

export const reactClass = connect(mapStateToProps)(PluginKCPS)

/////////////////////////////////////////////////////////////////////////
///                                                                   ///
///                             Server                                ///
///                                                                   ///
/////////////////////////////////////////////////////////////////////////

import { toNumber, isFinite, toInteger } from 'lodash'
import { remote } from 'electron'
import { gameRefreshPage } from 'views/services/utils'
import url from "url"
//TODO: 我想在返回图片时，当游戏画面大于标准时缩小到标准大小再发送，这样可以节省带宽。准备使用images模块，但在electron里使用需要重新编译native模块，我不会。
//import images from "images"
import { stateSelector } from 'views/utils/selectors'

const ORIGINAL_GRAPHIC_AREA_WIDTH = 800
const webview = $('kan-game webview')

////////////
// Page
////////////

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
const responseData = (request, response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	let params = url.parse(request.url, true).query
	let type = params.type
	switch (type) {
		default: // Only for debug
			console.log(stateSelector()) //TODO: NOT READY
	}
	response.end()
}

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
			const quality = config.get(CONFIG_PATH_QUALITY, DEFAULT_QUALITY)
			//TODO: 原计划的转换代码。还可以加入判断画面大于ORIGINAL_GRAPHIC_AREA_WIDTH时再转换
			//const buffer = images(image.toPNG()).resize(ORIGINAL_GRAPHIC_AREA_WIDTH).encode("jpg", {operation: JPEG_QUALITY})
			const buffer = image.toJPEG(quality)
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
		let ratio = config.get("poi.webview.width", -1) / ORIGINAL_GRAPHIC_AREA_WIDTH
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

////////
// Map
////////

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
	} else if (pathname === "/data") {
		responseData(request, response)
	} else {
		responseWrongPath(response)
	}
}

/////////////
// Server
/////////////

import http from "http"
import { observe, observer } from 'redux-observers'
import { store } from 'views/create-store'

var isServerOn = false

const server = http.createServer(onRequest)

const startServer = () => {
	if (!isServerOn) {
		let port = config.get(CONFIG_PATH_PORT, DEFAULT_PORT)
		server.listen(port)
		console.log("KCPS server started at port " + port + ".")
		isServerOn = true
	} else {
		console.warn("KCPS server is already started.")
	}
}

const stopServer = () => {
	if (isServerOn) {
		server.close()
		console.log("KCPS server stopped.")
		isServerOn = false
	} else {
		console.warn("KCPS server is already stopped.")
	}
}

const restartServer = () => {
	if (isServerOn) {
		server.close()
	}
	let port = config.get(CONFIG_PATH_PORT, DEFAULT_PORT)
	server.listen(port)
	console.log("KCPS server restarted at port " + port + ".")
}

const unsubscribeObserve = observe(store, [
	observer(
		state => kcpsTerminalConfigSelector(state),
		(dispatch, current, previous) => {
			restartServer()
		}
	)]
)

/////////////////////////////////////////////////////////////////////////
///                                                                   ///
///                            Interface                              ///
///                                                                   ///
/////////////////////////////////////////////////////////////////////////

//导入插件
export const pluginDidLoad = () => {
	startServer()
}

//移除插件
export const pluginWillUnload = () => {
	stopServer()
	unsubscribeObserve() //按照要求必须在移除是释放
}