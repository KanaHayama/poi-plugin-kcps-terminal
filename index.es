/////////////////////////////////////////////////////////////////////////
///                                                                   ///
///                            Utils                                  ///
///                                                                   ///
/////////////////////////////////////////////////////////////////////////

const EXTENSION_KEY = "poi-plugin-kcps-terminal"
const {$, i18n, config, getStore} = window

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
import { join } from 'path-extra'
import InplaceEdit from 'react-edit-inplace'

const __ = i18n[EXTENSION_KEY].__.bind(i18n[EXTENSION_KEY])

const CSS_FILENAME = "kcps-terminal.css"

const DEFAULT_PORT = 5277
const DEFAULT_TOKEN = ""
const DEFAULT_ZOOM = 1.0
const DEFAULT_QUALITY = 80

const CONFIG_PATH_PORT = "plugin.kcpsTerminal.port"
const CONFIG_PATH_TOKEN = "plugin.kcpsTerminal.token"
const CONFIG_PATH_ZOOM = "plugin.kcpsTerminal.zoom"
const CONFIG_PATH_QUALITY = "plugin.kcpsTerminal.quality"

const MIN_PORT = 0
const MIN_ZOOM = 0.25
const MIN_QUALITY = 0

const MAX_PORT = 65535
const MAX_ZOOM = 4 //限制最大放大率
const MAX_QUALITY = 100

const kcpsTerminalConfigSelector = createSelector(
	configSelector,
	(config) => ({
		port: get(config, CONFIG_PATH_PORT, DEFAULT_PORT),
		token: get(config, CONFIG_PATH_TOKEN, DEFAULT_TOKEN),
		zoom: get(config, CONFIG_PATH_ZOOM, DEFAULT_ZOOM),
		quality: get(config, CONFIG_PATH_QUALITY, DEFAULT_QUALITY)
	})
)

const mapStateToProps = (state) => kcpsTerminalConfigSelector(state)

export class PluginKCPS extends Component {
	handlePortChanged = ({newPortText}) => {
		config.set(CONFIG_PATH_PORT, parseInt(newPortText, 10))
	}
	
	handleTokenChanged = ({newTokenText}) => {
		config.set(CONFIG_PATH_TOKEN, newTokenText.trim())
	}
	
	handleZoomChanged = ({newZoomText}) => {
		config.set(CONFIG_PATH_ZOOM, parseFloat(newZoomText))
	}
	
	handleQualityChanged = ({newQualityText}) => {
		config.set(CONFIG_PATH_QUALITY, parseInt(newQualityText, 10))
	}
	
	render() {
		return (
			<div 
				id="kcps-terminal"
				className="kcps-terminal-wrapper"
			>
				<link
					rel="stylesheet"
					href={join(__dirname, CSS_FILENAME)}
				/>
				<div>
					<div>
						{__("Port")}({MIN_PORT}~{MAX_PORT}):
						<InplaceEdit
							validate={text => +text >= MIN_PORT && +text <= MAX_PORT}
							text={String(this.props.port)}
							paramName="newPortText"
							change={this.handlePortChanged}
							stopPropagation
							className="inplace-edit"
							activeClassName="inplace-edit-active"
						/>
					</div>
					<div>
						{__("Token")}:
						<InplaceEdit
							validate={text => /^\w*$/.test(text)}
							text={this.props.token}
							paramName="newTokenText"
							change={this.handleTokenChanged}
							stopPropagation
							className="inplace-edit"
							activeClassName="inplace-edit-active"
						/>
					</div>
					<div>
						{__("Zoom")}({MIN_ZOOM}~{MAX_ZOOM}):
						<InplaceEdit
							validate={text => +text > 0 && +text >= MIN_ZOOM && +text <= MAX_ZOOM}
							text={String(this.props.zoom)}
							paramName="newZoomText"
							change={this.handleZoomChanged}
							stopPropagation
							className="inplace-edit"
							activeClassName="inplace-edit-active"
						/>
					</div>
					<div>
						{__("JPEG Quality")}({MIN_QUALITY}~{MAX_QUALITY}):
						<InplaceEdit
							validate={text => +text >= MIN_QUALITY && +text <= MAX_QUALITY}
							text={String(this.props.quality)}
							paramName="newQualityText"
							change={this.handleQualityChanged}
							stopPropagation
							className="inplace-edit"
							activeClassName="inplace-edit-active"
						/>
					</div>
				</div>
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

////////
// Game Response Storage
////////

var gameResponseStorage = new Array();

const handleGameResponse = e => {
	const { path, body } = e.detail
	gameResponseStorage[path] = body
}

////////////
// Page
////////////

import { toNumber, toInteger, round } from 'lodash'
import { gameRefreshPage } from 'views/services/utils'
import url from "url"

const ORIGINAL_GRAPHIC_AREA_WIDTH = 1200 //HTML5版本
const ASPECT_RATIO = 1 / 0.6

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

const responseWrongToken = (response) => {
	response.statusCode = 403
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	//response.write("Wrong token")
	response.end()
}

const responseWrongPath = (response) => {
	response.statusCode = 404
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	//response.write("Page not found")
	response.end()
}

const responseSeverError = (response) => {
	response.statusCode = 500
	response.setHeader("Content-Type", "text/plain; charset=utf-8")
	//response.write("Internal server error")
	response.end()
}

//提供的功能

//返回内部数据，按照poi的内部定义方式（其他浏览器的定义方式还不清楚）
const responseData = (request, response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "application/json; charset=utf-8")
	const params = url.parse(request.url, true).query
	const type = params.type
	let data
	if (typeof(type) == "undefined" || type.trim() === "") { //仅供KancollePlayerSimulatorTool使用
		//按key字符串排序，方便查看，该过程非必须
		let keys = new Array()
		for (let key in gameResponseStorage) {
			keys.push(key)
		}
		keys.sort()
		//stringify不能处理array
		let array = new Array()
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i]
			array[i] = "\"" + key + "\":" + JSON.stringify(gameResponseStorage[key])
		}
		data = "{" + array.join(",") + "}" //包装成一个object
	} else {
		data = JSON.stringify(gameResponseStorage[type])
	}
	if (typeof(data) == "undefined") {
		response.write("undefined")
	} else {
		response.write(data)
	}
	response.end()
}

const responseCapture = (request, response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "image/jpeg")
	const { width, height, windowWidth, windowHeight } = getStore('layout.webview')
	const isolate = config.get('poi.isolateGameWindow', false)
	const scWidth = isolate ? windowWidth : width
	const scHeight = isolate ? windowHeight : height
	const rect = {
		x: 0,
		y: 0,
		width: Math.floor(scWidth * devicePixelRatio),
		height: Math.floor(scHeight * devicePixelRatio),
	}
	getStore('layout.webview.ref').getWebContents().capturePage(rect, image => {
			//image = image.resize({ width: Math.floor(scWidth), height: Math.floor(scHeight) })
			const quality = config.get(CONFIG_PATH_QUALITY, DEFAULT_QUALITY)
			const zoom = config.get(CONFIG_PATH_ZOOM, DEFAULT_ZOOM)
			const zoomWidth = toInteger(round(zoom * ORIGINAL_GRAPHIC_AREA_WIDTH))
			if (image.getSize().width != zoomWidth) {
				image = image.resize({width: zoomWidth})
			}
			const buffer = image.toJPEG(quality)
			response.write(buffer) //buffer里有数据，response也没问题，换成写字符串也能正常返回，但分离模式下为啥就卡在这了？
			response.end()
		})
}

const responseMouse = (request, response) => {
	const params = url.parse(request.url, true).query
	let x = params.x
	let y = params.y
	let command
	switch (params.type) {
		case "down":
			command = "mouseDown"
			break
		case "up":
			command = "mouseUp"
			break
		case "move":
			command = "mouseMove"
			break
		default:
			responseWrongParams(response)
			return
	}
	x = toNumber(x)
	y = toNumber(y)
	if (0 <= x && x <= 1 && 0 <= y && y <= 1) {
		const { width, height, windowWidth, windowHeight } = getStore('layout.webview')
		const isolate = config.get('poi.isolateGameWindow', false)
		const scWidth = isolate ? windowWidth : width
		const scHeight = isolate ? windowHeight : height
		if (scWidth <= 0) {
			responseSeverError(response)
		} else {
			x = toInteger(round(x * scWidth * devicePixelRatio))
			y = toInteger(round(y * scHeight * devicePixelRatio))
			getStore('layout.webview.ref').getWebContents().sendInputEvent({type: command, x: x, y: y})
			responseDefault(response)
		}
	} else {
		responseWrongParams(response)
	}
}

const responseRefresh = (response) => {
	gameRefreshPage()
	responseDefault(response)
}

////////
// Mapping
////////

const onRequest = (request, response) => {
	const pathname = url.parse(request.url).pathname
	if (pathname === "/" || pathname === "/hello") {
		responseHelloWorld(response)
	} else  {
		let params = url.parse(request.url, true).query
		let token = config.get(CONFIG_PATH_TOKEN, DEFAULT_TOKEN)
		if (token != "" && token != params.token) {
			responseWrongToken(response)
		} else {
			switch (pathname) {
				case "/capture":
					responseCapture(request, response)
					break
				case "/mouse":
					responseMouse(request, response)
					break
				case "/refresh":
					responseRefresh(response)
					break
				case "/data":
					responseData(request, response)
					break
				default:
					responseWrongPath(response)
			}
		}
	}
}

/////////////
// Server
/////////////

import http from "http"
import { store } from 'views/create-store'
import { observe, observer } from 'redux-observers'

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
	isServerOn = true
}


const unsubscribeObserve = observe(store, [
	observer(
		state => kcpsTerminalConfigSelector(state),
		(dispatch, current, previous) => {
			if (current.port != previous.port) {
				restartServer()
			}
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
	window.addEventListener('game.response', handleGameResponse)
	startServer()
}

//移除插件
export const pluginWillUnload = () => {
	stopServer()
	window.removeEventListener('game.response', handleGameResponse)
	unsubscribeObserve() //按照要求必须在移除时释放
}