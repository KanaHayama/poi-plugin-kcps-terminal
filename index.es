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
// States
////////

//零碎还不好归类的状态
const miscellaneousState = {
	//联合舰队
	combinedFleet : false, //是否是联合舰队
	
	//没有用（我就是懒得处理结尾项的逗号）
	nouse : false
}

var landBasedAirCorpsState = [
]//还不全

////////
// Game Request / Response Storage
////////

const gameRequestStorage = new Array()

var LastRequest

const handleGameRequest = e => {
	LastRequest = e.detail
	const { path, body } = e.detail
	gameRequestStorage[path] = body
	switch (path) {
		
	}
}

const gameResponseStorage = new Array()

var LastResponse

const handleGameResponse = e => {
	LastResponse = e.detail
	const { path, body } = e.detail
	gameResponseStorage[path] = body
	
	//定义变量（不能重复定义，所以放到外面）
	//基地航空队
	let crops
	
	//处理
	switch (path) {
		case "/kcsapi/api_port/port":
			//联合舰队
			miscellaneousState.combinedFleet = body.api_combined_flag != undefined && body.api_combined_flag != 0 //不考虑强制解除（值是负数）的情况
			break
			
		case "/kcsapi/api_get_member/mapinfo":
			//基地航空队
			landBasedAirCorpsState = body.api_air_base
			break
			
		case "/kcsapi/api_get_member/base_air_corps":
			//基地航空队
			//TODO: 没遇到过
			break
			
		case "/kcsapi/api_req_air_corps/set_plane":
			//基地航空队
			crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
			body.api_plane_info.forEach(p => {
				crops.api_plane_info[crops.api_plane_info.findIndex(plane => plane.api_squadron_id == p.api_squadron_id)] = p
			})
			break
			
		case "/kcsapi/api_req_air_corps/change_name":
			//基地航空队
			crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
			crops.api_name = LastRequest.body.api_name
			break
			
		case "/kcsapi/api_req_air_corps/set_action":
			//基地航空队
			crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
			crops.api_action_kind = LastRequest.body.api_action_kind
			break
			
		case "/kcsapi/api_req_air_corps/supply":
			//基地航空队
			crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
			crops.api_distance = body.api_distance
			body.api_plane_info.forEach(p => {
				crops.api_plane_info[crops.api_plane_info.findIndex(plane => plane.api_squadron_id == p.api_squadron_id)] = p
			})
			break
			
		case "/kcsapi/api_req_air_corps/expand_base":
			//基地航空队
			//TODO: 没遇到过
			break
			
		case "/kcsapi/api_req_hensei/combined":
			//联合舰队
			miscellaneousState.combinedFleet = body.api_combined == 1
			break
			
		case "/kcsapi/":
			
			break
			
	}
}

////////////
// Page
////////////

import { toNumber, toInteger, round } from 'lodash'
import { gameRefreshPage } from 'views/services/utils'
import url from "url"

import { store } from 'views/create-store'
import { stateSelector, constSelector, basicSelector, fleetsSelector, shipsSelector, equipsSelector, repairsSelector, mapsSelector, sortieSelector, battleSelector } from 'views/utils/selectors'

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

const responseCapture = (request, response) => {
	const params = url.parse(request.url, true).query
	const format = params.format
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
			//console.log(image.getSize())//缩放设置不是100%时这里的分辨率不对，导致脚本不能用
			if (image.getSize().width != zoomWidth) {
				image = image.resize({width: zoomWidth})
			}
			response.statusCode = 200
			let buffer
			if (format == "png") {//仅供我自己调试截图用，脚本自身不会要求返回png
				response.setHeader("Content-Type", "image/png")
				buffer = image.toPNG()
			} else {
				response.setHeader("Content-Type", "image/jpeg")
				buffer = image.toJPEG(quality)
			}
			response.write(buffer) //buffer里有数据，response也没问题，换成写字符串也能正常返回，但分离模式下为啥就卡在这了？
			response.end()
		})
}

//https://electronjs.org/docs/api/web-contents
const responseMouse = (request, response) => {
	const params = url.parse(request.url, true).query
	let x = params.x
	let y = params.y
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
			x = toInteger(round(x * scWidth)) //这里不用乘devicePixelRatio
			y = toInteger(round(y * scHeight)) //这里不用乘devicePixelRatio
			let blinkWebMouseEvent
			switch (params.type) {
				case "down":
					blinkWebMouseEvent = {type: "mouseDown", x: x, y: y, globalX: x, globalY: y, button: 'left', clickCount: 1 }
					break
				case "up":
					blinkWebMouseEvent = {type: "mouseUp", x: x, y: y, globalX: x, globalY: y, button: 'left', clickCount: 1 }
					break
				case "move":
					blinkWebMouseEvent = {type: "mouseMove", x: x, y: y, globalX: x, globalY: y }
					break
				case "enter"://1.2.0.0新增，为了解决提督室按钮点击失效的问题
					blinkWebMouseEvent = {type: "mouseEnter", x: x, y: y, globalX: x, globalY: y }
					break
				case "leave"://1.2.0.0新增，为了解决提督室按钮点击失效的问题
					blinkWebMouseEvent = {type: "mouseLeave", x: x, y: y, globalX: x, globalY: y }
					break
				default:
					responseWrongParams(response)
					return
			}
			getStore('layout.webview.ref').getWebContents().sendInputEvent(blinkWebMouseEvent)
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

//返回状态数据。因为不同的response可能修改同一个数据，因此需要按照api的格式维护一个更新。仅有多个api会修改同一个数据时才会用到这个函数，否则一律使用responseResponse
//这里把poi里所有的相关数据都搬过来了，具体哪些有用还不清楚。不是每一个都需要在插件中实现。
//TODO: 把没用的(非必须的)标记出来
const responseData = (request, response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "application/json; charset=utf-8")
	const params = url.parse(request.url, true).query
	const type = params.type
	let selector
	let value
	switch (type) {
		//poi自带的（最后需要全部被替换）
		case "const": //常量数据应该从Response获得，这个接口在插件中非必须
			selector = constSelector
			value = selector(store.getState())
			break
		case "basic":
			selector = basicSelector
			value = selector(store.getState())
			break;
		case "fleets": //已在kcps kai 1.0.0中使用
			selector = fleetsSelector
			value = selector(store.getState())
			break
		case "ships": //已在kcps kai 1.0.0中使用 //api里返回的是数组，这里咋返回的是字典呢？明明key就是index+1 //TODO: 改成返回api的array形式
			selector = shipsSelector
			value = selector(store.getState())
			break
		case "equips": //已在kcps kai 1.2.0中使用 //api里返回的是数组，这里咋返回的是字典呢？明明key就是index+1 //TODO: 改成返回api的array形式
			selector = equipsSelector
			value = selector(store.getState())
			break
		case "repairs": //已在kcps kai 1.0.0中使用//使用高速修复时游戏服务器不返回新的修复渠数据，而这里会把这个修复渠的数据自动设置为默认值
			selector = repairsSelector
			value = selector(store.getState())
			break
		case "constructions":
			selector = (state) => state.info.constructions
			value = selector(store.getState())
			break
		case "resources":
			selector = (state) => state.info.resources
			value = selector(store.getState())
			break
		case "maps":
			selector = mapsSelector
			value = selector(store.getState())
			break
		case "sortie": //已在kcps kai 1.1.0中使用//这里的数据是poi自己定义的，因为赶时间做出成品，这里先用着。之后有空自己定义自己维护
			selector = sortieSelector
			value = selector(store.getState())
			break
		case "battle": //已在kcps kai 1.1.0中使用//这里的数据是poi自己定义的，因为赶时间做出成品，这里先用着。之后有空自己定义自己维护
			selector = battleSelector
			value = selector(store.getState())
			break
		//自己实现的
		case "miscellaneous":
			value = miscellaneousState
			break
		case "landBasedAirCorps":
			value = landBasedAirCorpsState
	}
	response.write(JSON.stringify(value))
	response.end()
}

//将记录的游戏request返回。
//目前仅调试用
const responseRequest = (request, response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "application/json; charset=utf-8")
	const params = url.parse(request.url, true).query
	const type = params.type
	let data
	if (typeof(type) == "undefined" || type.trim() === "") { //这个接口在插件中非必须
		//按key字符串排序，方便查看，该过程非必须
		let keys = new Array()
		for (let key in gameRequestStorage) {
			keys.push(key)
		}
		keys.sort()
		//stringify不能处理array
		let array = new Array()
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i]
			array[i] = "\"" + key + "\":" + JSON.stringify(gameRequestStorage[key])
		}
		data = "{" + array.join(",") + "}" //包装成一个object
	} else {
		data = JSON.stringify(gameRequestStorage[type])
	}
	if (typeof(data) == "undefined") {
		response.write("undefined")
	} else {
		response.write(data)
	}
	response.end()
}

//将记录的游戏response返回。
//因为不做任何处理，所以实现起来非常简单。
//已在kcps kai中使用的API有：
//1.0.0:
//api_start2/getData	各种常量数据
//api_get_member/mission	判断已开放的远征
//api_get_member/require_info	判断临时补给是否可用
//1.1.0:
//api_get_member/mapinfo	判断海域是否开放
//api_req_sortie/battleresult
const responseResponse = (request, response) => {
	response.statusCode = 200
	response.setHeader("Content-Type", "application/json; charset=utf-8")
	const params = url.parse(request.url, true).query
	const type = params.type
	let data
	if (typeof(type) == "undefined" || type.trim() === "") { //这个接口在插件中非必须
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
				case "/request": //只有功能涉及到读包时才需要实现，不实现可返回404
					responseRequest(request, response)
					break
				case "/response": //只有功能涉及到读包时才需要实现，不实现可返回404
					responseResponse(request, response)
					break
				case "/data": //只有功能涉及到读包时才需要实现，不实现可返回404
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

const printMouseEvent = e => {
	console.log(e)
}

//导入插件
export const pluginDidLoad = () => {
	window.addEventListener('game.request', handleGameRequest)
	window.addEventListener('game.response', handleGameResponse)
	/*貌似两个里没有一个pid是渲染线程
	console.log(window.process.pid)
	console.log(getStore('layout.webview.ref').getWebContents().getOSProcessId())
	*/
	startServer()
}

//移除插件
export const pluginWillUnload = () => {
	stopServer()
	
	window.removeEventListener('game.response', handleGameResponse)
	window.removeEventListener('game.request', handleGameRequest)
	unsubscribeObserve() //按照要求必须在移除时释放
}