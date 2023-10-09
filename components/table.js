/** @format */

import { useState, useEffect, useRef } from "react";
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_FullScreenToggleButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleGlobalFilterButton,
  MRT_ToggleFiltersButton
} from "material-react-table";
import { useDefaultFetcher } from "./utils";

const COLOR_BASE = "#c7463e";
const COLOR_BACKGROUND = "#141414";
const COLOR_BACKGROUND_HOVER = "#222222";
const COLOR_WHITE = "#dddddd";
const COLOR_DARK_LIGHT = "#9e9e9e";
const COLOR_DARK = "#333333";

const COLUMNS = [
  {
    header: "PID",
    size: 100,
    accessorKey: "pid"
  },
  {
    header: "Name",
    size: 100,
    accessorKey: "username"
  },
  {
    header: "CPU %",
    size: 100,
    accessorKey: "cpu_percent"
  },
  {
    header: "RAM %",
    size: 100,
    accessorKey: "memory_percent"
  },
  {
    header: "VRAM %",
    size: 100,
    accessorKey: "gpu_memory_percent"
  },
  {
    header: "Command Line",
    size: 500,
    accessorKey: "cmdline"
  }
];

export const ProcessTable = ({ endpoint, intervalMs, isServerAlive }) => {
  const data = useDefaultFetcher(endpoint, intervalMs, []);

  return (
    <MaterialReactTable
      columns={COLUMNS}
      data={data}
      enableColumnResizing
      enableRowVirtualization
      enableGlobalFilterModes
      enableClickToCopy
      enablePagination={false}
      enableRowSelection={false}
      enableTopToolbar={true}
      enableBottomToolbar={false}
      muiTableHeadRowProps={{
        sx: {
          color: COLOR_WHITE,
          backgroundColor: COLOR_BACKGROUND
        }
      }}
      muiTableHeadCellProps={{
        sx: {
          fontSize: "1.0rem",
          color: COLOR_DARK_LIGHT,
          py: 2,
          backgroundColor: COLOR_BACKGROUND,
          "& .Mui-TableHeadCell-Content": {
            justifyContent: "space-between"
          },
          borderBottom: "1px solid #333333"
        }
      }}
      muiTableBodyCellProps={{
        sx: {
          fontSize: "1.0rem",
          fontFamily: "Source Code Pro",
          color: COLOR_WHITE,
          backgroundColor: COLOR_BACKGROUND,
          borderBottom: "1px solid #333333"
        }
      }}
      muiTableBodyRowProps={{
        sx: {
          fontSize: "10px",
          backgroundColor: COLOR_BACKGROUND,
          "&:hover td": {
            backgroundColor: COLOR_BACKGROUND_HOVER
          }
        }
      }}
      muiTableBodyCellSkeletonProps={{
        sx: {
          backgroundColor: COLOR_DARK
        }
      }}
      muiTopToolbarProps={{
        sx: {
          backgroundColor: "transparent",
          marginRight: "-18px"
        }
      }}
      muiTableContainerProps={{
        sx: {
          maxWidth: "100%",
          maxHeight: "350px",
          backgroundColor: COLOR_BACKGROUND,
          border: 0
        }
      }}
      muiTablePaperProps={{
        sx: {
          backgroundColor: "transparent",
          border: 0
        }
      }}
      muiTableHeadCellColumnActionsButtonProps={{
        sx: {
          color: COLOR_WHITE
        }
      }}
      muiTableHeadCellFilterTextFieldProps={{
        InputProps: {
          sx: {
            color: COLOR_WHITE,
            backgroundColor: COLOR_BACKGROUND,
            fontSize: "0.9rem",
            ":before": { borderBottomColor: COLOR_DARK },
            ":after": { borderBottomColor: COLOR_BASE }
          }
        },
        sx: {
          color: COLOR_WHITE,
          backgroundColor: COLOR_BACKGROUND
        }
      }}
      muiSearchTextFieldProps={{
        InputProps: {
          sx: {
            color: COLOR_WHITE,
            backgroundColor: COLOR_BACKGROUND,
            fontSize: "0.9rem",
            ":before": { borderBottomColor: COLOR_DARK },
            ":after": { borderBottomColor: COLOR_BASE }
          }
        },
        sx: {
          color: COLOR_WHITE,
          backgroundColor: COLOR_BACKGROUND
        }
      }}
      muiLinearProgressProps={{
        sx: {
          backgroundColor: COLOR_DARK,
          "& .MuiLinearProgress-bar": {
            backgroundColor: COLOR_BASE
          },
          width: "98%"
        }
      }}
      state={{ isLoading: !isServerAlive }}
      rowVirtualizerProps={{ overscan: 10 }}
      initialState={{
        sorting: [{ id: "cpu_percent", desc: true }],
        density: "compact"
      }}
      renderToolbarInternalActions={({ table }) => (
        <>
          <MRT_ToggleGlobalFilterButton
            style={{ color: COLOR_WHITE }}
            table={table}
          />
          <MRT_ToggleFiltersButton style={{ color: COLOR_WHITE }} table={table} />
          <MRT_ShowHideColumnsButton
            style={{ color: COLOR_WHITE }}
            table={table}
          />
          <MRT_ToggleDensePaddingButton
            style={{ color: COLOR_WHITE }}
            table={table}
          />
          <MRT_FullScreenToggleButton
            style={{ color: COLOR_WHITE }}
            table={table}
          />
        </>
      )}
      renderEmptyRowsFallback={(_table) => (
        <>
          <h2
            style={{
              backgroundColor: COLOR_BACKGROUND,
              fontFamily: "Source Code Pro",
              color: COLOR_WHITE,
              paddingTop: "5rem",
              paddingBottom: "5rem"
            }}
          >
            Nothing to display
          </h2>
        </>
      )}
    />
  );
};
