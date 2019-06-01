/*
    poi-plugin-kcps-terminal, providing control & data support for kcps kai.
    Copyright (C) 2018  Kana

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or 
    any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
import { ButtonToolbar, ToggleButtonGroup, ToggleButton, Checkbox  } from 'react-bootstrap'
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
const POINTER_TYPE_WIN = true
const POINTER_TYPE_WEB = false
const DEFAULT_POINTER_TYPE = POINTER_TYPE_WEB //原计划命名为WIN & WEB，但ToggleButtonGroup&ToggleButton做RadioGroup不知道为什么不好使，只能默认true为启用win版指针事件

const CONFIG_PATH_PORT = "plugin.kcpsTerminal.port"
const CONFIG_PATH_TOKEN = "plugin.kcpsTerminal.token"
const CONFIG_PATH_ZOOM = "plugin.kcpsTerminal.zoom"
const CONFIG_PATH_QUALITY = "plugin.kcpsTerminal.quality"
const CONFIG_PATH_POINTER_TYPE = "plugin.kcpsTerminal.pointerType"

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
		quality: get(config, CONFIG_PATH_QUALITY, DEFAULT_QUALITY),
		pointerType: get(config, CONFIG_PATH_POINTER_TYPE, DEFAULT_POINTER_TYPE)
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
	
	handlePointerTypeChanged = () => {
		config.set(CONFIG_PATH_POINTER_TYPE, !this.props.pointerType)
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
					<div>
						<Checkbox type="checkbox" checked={this.props.pointerType} onClick={this.handlePointerTypeChanged}>
							{__("Using native pointer emulator for Windows")}
						</Checkbox>
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

//还没有获取到的状态设置为null可以利用本体的cache功能

//零碎还不好归类的状态（不方便设置为null，所以内部每一项要有默认值，缺点就是刚启动插件没刷新数据时值与实际的会有差别）
const miscellaneousState = {
	//联合舰队
	combinedFleet : false, //是否是联合舰队
	
	//没有用（我就是懒得管理结尾项的逗号）
	nouse : false
}

//基地航空队
var landBasedAirCorpsState = null //[]

//预设编成
var preSetsState = null //{}

////////
// Game Request / Response Storage
////////

const gameRequestStorage = new Array()

var LastRequest

const handleGameRequest = e => {
	LastRequest = e.detail
	const { path, body } = e.detail
	gameRequestStorage[path] = body
	//处理
	try {
		switch (path.replace("/kcsapi/", "")) {
			case "":
				
				break
		}
	} catch(ex) {
		console.log(ex)
	}
}

const gameResponseStorage = new Array()

var LastResponse

const handleGameResponse = e => {
	LastResponse = e.detail
	const { path, body } = e.detail
	gameResponseStorage[path] = body
	
	//定义变量（case里定义算重复定义，不允许，所以只能放到外面）
	//基地航空队
	let crops
	//处理
	try {
		switch (path.replace("/kcsapi/", "")) {
			case "api_port/port":
				//联合舰队
				miscellaneousState.combinedFleet = body.api_combined_flag != undefined && body.api_combined_flag != 0 //不考虑强制解除（值是负数）的情况
				break
				
			case "api_get_member/mapinfo":
				//基地航空队
				landBasedAirCorpsState = body.api_air_base
				break
				
			case "api_get_member/base_air_corps":
				//基地航空队
				//TODO: 没遇到过
				break
				
			case "api_req_air_corps/set_plane":
				//基地航空队//没管null
				crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
				body.api_plane_info.forEach(p => {
					crops.api_plane_info[crops.api_plane_info.findIndex(plane => plane.api_squadron_id == p.api_squadron_id)] = p
				})
				break
				
			case "api_req_air_corps/change_name":
				//基地航空队//没管null
				crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
				crops.api_name = LastRequest.body.api_name
				break
				
			case "api_req_air_corps/set_action":
				//基地航空队//没管null
				crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
				crops.api_action_kind = LastRequest.body.api_action_kind
				break
				
			case "api_req_air_corps/supply":
				//基地航空队//没管null
				crops = landBasedAirCorpsState.find(crops => crops.api_area_id == LastRequest.body.api_area_id && crops.api_rid == LastRequest.body.api_base_id)
				crops.api_distance = body.api_distance
				body.api_plane_info.forEach(p => {
					crops.api_plane_info[crops.api_plane_info.findIndex(plane => plane.api_squadron_id == p.api_squadron_id)] = p
				})
				break
				
			case "api_req_air_corps/expand_base":
				//基地航空队
				//TODO: 没遇到过
				break
				
			case "api_req_hensei/combined":
				//联合舰队
				miscellaneousState.combinedFleet = body.api_combined == 1
				break
				
			case "api_get_member/preset_deck":
				//预设编成
				preSetsState = body
				break
				
			case "api_req_hensei/preset_register":
				//预设编成//没管null
				preSetsState.api_deck[LastRequest.body.api_preset_no] = body
				break
				
			case "api_req_hensei/preset_delete":
				//预设编成//没管null
				delete preSetsState.api_deck[LastRequest.body.api_preset_no]
				break
				
			case "":
				
				break
				
		}
	} catch (ex) {
		console.log(ex)
	}
}

////////////
// Page
////////////

import { toNumber, toInteger, round } from 'lodash'
import { gameRefreshPage, getTitleBarHeight, getPoiInfoHeight, getYOffset, getRealSize } from 'views/services/utils'
import url from "url"
import { remote } from 'electron'
const { BrowserWindow } = remote

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
			try {
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
			} catch (ex) {
				console.log(ex)
				response.statusCode = 500
			} finally {
				response.end()
			}
		})
}

var WindowsX64DedicateMouseModule = undefined
//https://electronjs.org/docs/api/web-contents
const responseMouse = (request, response) => {
	const params = url.parse(request.url, true).query
	let x = params.x
	let y = params.y
	x = toNumber(x)
	y = toNumber(y)
	if (0 <= x && x <= 1 && 0 <= y && y <= 1) {
		try {
			const { width, height, windowWidth, windowHeight } = getStore('layout.webview')
			const isolate = config.get('poi.isolateGameWindow', false)
			const scWidth = isolate ? windowWidth : width
			const scHeight = isolate ? windowHeight : height
			if (scWidth <= 0) {
				responseSeverError(response)
			} else {
				let zoom = config.get('poi.appearance.zoom', 1)//poi的缩放选项（不是分辨率缩放）。虽然缩放后画面看起来大小不变，但实际鼠标坐标要乘这个。
				x = toInteger(round(x * scWidth * zoom)) //这里不用乘devicePixelRatio
				y = toInteger(round(y * scHeight * zoom)) //这里不用乘devicePixelRatio
				let pointerType = config.get(CONFIG_PATH_POINTER_TYPE, DEFAULT_POINTER_TYPE)
				switch (pointerType) {
					case POINTER_TYPE_WIN:
						const gameHeight = getRealSize(getStore('layout.webview.height'))
						const gameWidth = getRealSize(getStore('layout.webview.width'))
						const windowSize = remote.getCurrentWindow().getSize()
						const windowHeight = windowSize[1]
						const windowWidth = windowSize[0]
						const titleBarHeight = getRealSize(getTitleBarHeight())
						const poiInfoHeight = getRealSize(getPoiInfoHeight())
						const yOffset = getRealSize(getYOffset())
						const layoutMode = config.get('poi.layout.mode')
						const layoutReverse = config.get('poi.layout.reverse')
						if (isolate) {
							throw "isolate mode has not been supported yet"
						} else {
							if (layoutMode == "horizontal") {
								if (layoutReverse) {
									x = windowWidth - (gameWidth - x)
								}
								y = y + titleBarHeight + (windowHeight - gameHeight - yOffset) / 2
							} else {
								if (layoutReverse) {
									y = windowHeight - poiInfoHeight - (gameHeight - y)
								} else {
									y = y + titleBarHeight
								}
								x = x + (windowWidth - gameWidth) / 2
							}
						}
						//Windows鼠标模拟这里要乘devicePixelRatio
						x = toInteger(round(x * devicePixelRatio))
						y = toInteger(round(y * devicePixelRatio))
						//console.log({x:x,y:y,gameHeight:gameHeight,gameWidth:gameWidth,windowSize:windowSize,windowHeight:windowHeight,windowWidth:windowWidth,titleBarHeight:titleBarHeight,poiInfoHeight:poiInfoHeight,yOffset:yOffset,layoutMode:layoutMode,layoutReverse:layoutReverse})
						if (WindowsX64DedicateMouseModule == undefined) {
							WindowsX64DedicateMouseModule = require("./binding")
							//TODO: 禁用、启用插件后无法再次载入，报错Module did not self-register。为什么，如何解决
						}
						switch (params.type) {
							case "down":
								WindowsX64DedicateMouseModule.down("poi", x, y)
								break
							case "up":
								WindowsX64DedicateMouseModule.up("poi", x, y)
								break
							case "move":
								WindowsX64DedicateMouseModule.move("poi", x, y)
								break
							case "enter":
								break
							case "leave":
								break
							default:
								responseWrongParams(response)
								return
						}
						break;
					default:
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
						break;
				}
			}
			response.statusCode = 200
		} catch (ex) {
			console.log(ex)
			response.statusCode = 500
		} finally {
			response.end()
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
	try {
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
			case "basic": //已在kcps kai 1.2.1中使用
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
				break
			case "preSets":
				value = preSetsState
				break
		}
		response.write(JSON.stringify(value))
	} catch (ex) {
		console.log(ex)
		response.statusCode = 500
	} finally {
		response.end()
	}
}

//将记录的游戏request返回。
//目前仅调试用
const responseRequest = (request, response) => {
	try {
		response.statusCode = 200
		response.setHeader("Content-Type", "application/json; charset=utf-8")
		const params = url.parse(request.url, true).query
		const type = params.type
		let data
		if (typeof(type) == "undefined" || type.trim() === "") { //仅供我自己调试用，这个接口在插件中非必须
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
	} catch (ex) {
		console.log(ex)
		response.statusCode = 500
	} finally {
		response.end()
	}
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
	try {
		response.statusCode = 200
		response.setHeader("Content-Type", "application/json; charset=utf-8")
		const params = url.parse(request.url, true).query
		const type = params.type
		let data
		if (typeof(type) == "undefined" || type.trim() === "") { //仅供我自己调试用，这个接口在插件中非必须
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
	} catch (ex) {
		console.log(ex)
		response.statusCode = 500
	} finally {
		response.end()
	}
}

////////
// Mapping
////////

const onRequest = (request, response) => {
	try {
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
	} catch (ex) {
		console.log(ex)
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
		console.warn("KCPS server has already started.")
	}
}

const stopServer = () => {
	if (isServerOn) {
		server.close()
		console.log("KCPS server stopped.")
		isServerOn = false
	} else {
		console.warn("KCPS server has already stopped.")
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