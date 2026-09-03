import { Button, Form } from "react-bootstrap";
import { CustomTooltip } from "./CustomToolTip";
import InfoIcon from "@material-ui/icons/InfoOutlined";
import { Dispatch, SetStateAction } from "react";

interface SearchBarProps {
  userSearchVal: string;
  setUserSearchVal: Dispatch<SetStateAction<string>>;
  onBeforeSearch?: () => void;
  onSearch: (searchVal: string) => void;
  recordCount: number | null;
  uniqueSampleCount?: number;
  isLoading: boolean;
  prioritizeIdMatches?: boolean;
  setPrioritizeIdMatches?: Dispatch<SetStateAction<boolean>>;
}

export function SearchBar({
  userSearchVal,
  setUserSearchVal,
  onBeforeSearch,
  onSearch,
  recordCount,
  uniqueSampleCount,
  isLoading,
  prioritizeIdMatches,
  setPrioritizeIdMatches,
}: SearchBarProps) {
  function handleSearch(userSearchVal: string) {
    if (onBeforeSearch) {
      onBeforeSearch();
    }
    onSearch(userSearchVal);
  }
  return (
    <div className="d-flex align-items-center justify-content-center gap-2">
      <CustomTooltip
        icon={<InfoIcon style={{ fontSize: 18, color: "grey" }} />}
      >
        Click on "Search" or press "Enter" to start searching. To bulk search,
        input a list of values separated by spaces or commas (example:{" "}
        <code>value1 value2 value3</code>). To include multiple words in a
        single search term, enclose them in single or double quotes (example:{" "}
        <code>"Bone Cancer"</code>).
      </CustomTooltip>

      <Form.Control
        type="search"
        className="d-inline-block"
        style={{ width: "300px" }}
        size="sm"
        placeholder={`Search...`}
        aria-label="Search"
        value={userSearchVal}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch(userSearchVal);
          }
        }}
        onChange={(e) => {
          const currentValue = e.currentTarget.value;
          // "Reset" the grid when the search input is cleared by the user
          // to be consistent with cBioPortal
          if (currentValue === "") {
            setUserSearchVal("");
            handleSearch("");
          } else {
            setUserSearchVal(currentValue);
          }
        }}
      />

      <Button
        onClick={() => handleSearch(userSearchVal)}
        className="btn btn-secondary"
        size="sm"
      >
        Search
      </Button>

      {setPrioritizeIdMatches && (
        <>
          <div className="vr" style={{ height: "20px" }} />
          <div className="d-flex align-items-center gap-1">
            <Form.Check
              type="switch"
              id="prioritize-ids-switch"
              className="mt-1"
              label="Prioritize ID matches"
              checked={!!prioritizeIdMatches}
              onChange={(e) => setPrioritizeIdMatches(e.currentTarget.checked)}
            />
            <CustomTooltip
              icon={<InfoIcon style={{ fontSize: 18, color: "grey" }} />}
            >
              When enabled, prioritizes matches to sample/patient ID fields
              (much faster). When disabled, performs a broader search across all
              fields.
            </CustomTooltip>
          </div>
        </>
      )}

      <span>
        {isLoading ? "Loading" : Number(recordCount).toLocaleString()} matches{" "}
        {isLoading
          ? ""
          : uniqueSampleCount !== undefined
          ? `(${Number(uniqueSampleCount).toLocaleString()} unique samples)`
          : ""}
      </span>
    </div>
  );
}
