import { ITooltipComp, ITooltipParams } from "ag-grid-community";

export class StatusTooltip implements ITooltipComp {
  eGui: any;
  init(params: ITooltipParams & { color: string }) {
    const eGui = (this.eGui = document.createElement("div"));
    const color = params.color || "white";
    const data = params.api!.getDisplayedRowAtIndex(params.rowIndex!)!.data;

    eGui.classList.add("custom-tooltip");
    //@ts-ignore
    eGui.style["background-color"] = color;
    eGui.innerHTML = `
            <p>
                <span class"name">${data?.["hasStatusStatuses"][0].validationStatus}</span>
            </p>
        `;
  }

  getGui() {
    return this.eGui;
  }
}
