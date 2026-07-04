export interface MiscellaneousState {
  combinedFleet: boolean
  combinedFleetType: number
}

export interface GameState {
  miscellaneous: MiscellaneousState
  landBasedAirCorps: unknown[] | null
  preSets: Record<string, unknown> | null
}

interface RequestDetail {
  body: Record<string, unknown>
}

export class GameStateManager {
  private state: GameState = {
    miscellaneous: { combinedFleet: false, combinedFleetType: 0 },
    landBasedAirCorps: null,
    preSets: null,
  }

  getMiscellaneous(): MiscellaneousState {
    return this.state.miscellaneous
  }

  getLandBasedAirCorps(): unknown[] | null {
    return this.state.landBasedAirCorps
  }

  getPreSets(): Record<string, unknown> | null {
    return this.state.preSets
  }

  // Exceptions propagate to GameEventHandler, which reports them to the error log
  processResponse(apiPath: string, body: Record<string, unknown>, lastRequest: RequestDetail | null): void {
    switch (apiPath) {
      case 'api_port/port': {
        const flag = body.api_combined_flag as number | undefined
        this.state.miscellaneous.combinedFleet = flag != null && flag > 0
        this.state.miscellaneous.combinedFleetType = flag != null && flag > 0 ? flag : 0
        break
      }

      case 'api_get_member/mapinfo':
        this.state.landBasedAirCorps = (body.api_air_base as unknown[] | undefined) ?? null
        break

      case 'api_req_air_corps/set_plane': {
        if (!this.state.landBasedAirCorps || !lastRequest) break
        const corps = this.findCorps(lastRequest.body)
        if (!corps) break
        const planeInfo = body.api_plane_info as Array<Record<string, unknown>>
        const corpsPlaneInfo = (corps as Record<string, unknown>).api_plane_info as Array<Record<string, unknown>>
        planeInfo.forEach(p => {
          const idx = corpsPlaneInfo.findIndex(
            plane => plane.api_squadron_id === p.api_squadron_id,
          )
          if (idx >= 0) corpsPlaneInfo[idx] = p
        })
        break
      }

      case 'api_req_air_corps/change_name': {
        if (!this.state.landBasedAirCorps || !lastRequest) break
        const corps = this.findCorps(lastRequest.body)
        if (corps) (corps as Record<string, unknown>).api_name = lastRequest.body.api_name
        break
      }

      case 'api_req_air_corps/set_action': {
        if (!this.state.landBasedAirCorps || !lastRequest) break
        const area = Number(lastRequest.body.api_area_id)
        const bases = String(lastRequest.body.api_base_id).split(',').map(Number)
        const actions = String(lastRequest.body.api_action_kind).split(',').map(Number)
        for (let i = 0; i < bases.length; i++) {
          const corps = this.state.landBasedAirCorps.find(
            c => (c as Record<string, unknown>).api_area_id === area && (c as Record<string, unknown>).api_rid === bases[i],
          ) as Record<string, unknown> | undefined
          if (corps) corps.api_action_kind = actions[i]
        }
        break
      }

      case 'api_req_air_corps/supply': {
        if (!this.state.landBasedAirCorps || !lastRequest) break
        const corps = this.findCorps(lastRequest.body) as Record<string, unknown> | undefined
        if (!corps) break
        corps.api_distance = body.api_distance
        const planeInfo = body.api_plane_info as Array<Record<string, unknown>>
        const corpsPlaneInfo = corps.api_plane_info as Array<Record<string, unknown>>
        planeInfo.forEach(p => {
          const idx = corpsPlaneInfo.findIndex(
            plane => plane.api_squadron_id === p.api_squadron_id,
          )
          if (idx >= 0) corpsPlaneInfo[idx] = p
        })
        break
      }

      case 'api_req_hensei/combined':
        this.state.miscellaneous.combinedFleet = body.api_combined === 1
        this.state.miscellaneous.combinedFleetType = lastRequest?.body.api_combined_type as number ?? 0
        break

      case 'api_get_member/preset_deck':
        this.state.preSets = body as unknown as Record<string, unknown>
        break

      case 'api_req_hensei/preset_register': {
        if (!this.state.preSets || !lastRequest) break
        const deck = this.state.preSets.api_deck as Record<string, unknown> | undefined
        if (deck) deck[String(lastRequest.body.api_preset_no)] = body
        break
      }

      case 'api_req_hensei/preset_delete': {
        if (!this.state.preSets || !lastRequest) break
        const deck = this.state.preSets.api_deck as Record<string, unknown> | undefined
        if (deck) delete deck[String(lastRequest.body.api_preset_no)]
        break
      }
    }
  }

  private findCorps(requestBody: Record<string, unknown>): unknown | undefined {
    if (!this.state.landBasedAirCorps) return undefined
    return this.state.landBasedAirCorps.find(
      c => (c as Record<string, unknown>).api_area_id == requestBody.api_area_id
        && (c as Record<string, unknown>).api_rid == requestBody.api_base_id,
    )
  }
}
