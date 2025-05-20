import os
from datetime import datetime
import streamlit as st
import pandas as pd
 qxtbxt-codex/add-spreadsheet-feature-with-editable-grid
=======
from st_aggrid import AgGrid, GridOptionsBuilder
main

st.set_page_config(page_title="Sales Orders Tracker", page_icon="📦")

# ABB-themed colors
ABB_RED = "#E60012"

st.markdown(
    f"""
    <style>
    .stButton>button {{ background-color:{ABB_RED}; color:white; }}
    </style>
    """,
    unsafe_allow_html=True,
)

 qxtbxt-codex/add-spreadsheet-feature-with-editable-grid
st.header("Project tasks")

# Initial task data
df = pd.DataFrame(
    [
        {"Task": "Plan project", "Owner": "Alice", "Done": False},
        {"Task": "Develop feature", "Owner": "Bob", "Done": False},
        {"Task": "Write docs", "Owner": "Charlie", "Done": False},
    ]
)

# Display editable grid and capture updates using Streamlit's built-in editor
edited_df = st.data_editor(df, num_rows="dynamic", use_container_width=True)

if st.button("Save to CSV"):
    edited_df.to_csv("tasks.csv", index=False)
    st.success("Saved updates to tasks.csv")
=======
st.title("📦 Sales Orders Tracker")

# Load CSV either from upload or bundled sample
uploaded = st.file_uploader("Upload sales order CSV", type="csv")
if uploaded is not None:
    df = pd.read_csv(uploaded)
else:
    df = pd.read_csv("sample_sales_orders.csv")

# Column mapping rules
COLUMN_MAP = {
    "Cust. Material": "Material",
    "First Date": "Requested Date",
    "Est. Ship Date": "Expected Delivery",
    "Orig. Ship Date": "Original Delivery",
    "Sales Order": "sales_order",
    "Item": "item",
    "Customer Name": "customer",
}

# Apply mapping
renamed = {}
for col in df.columns:
    key = col.strip()
    renamed[col] = COLUMN_MAP.get(key, key)

df.rename(columns=renamed, inplace=True)

# Auto-generate item_id
if {"sales_order", "item"}.issubset(df.columns):
    df["item_id"] = df["sales_order"].astype(str) + "-" + df["item"].astype(str)

# Flag late orders
if "Expected Delivery" in df.columns:
    today = pd.Timestamp.utcnow().normalize()
    df["Late"] = pd.to_datetime(df["Expected Delivery"], errors="coerce") < today

st.subheader("Orders")

# Compare with previously saved orders if available
previous_path = "saved_orders.csv"
if os.path.exists(previous_path):
    prev_df = pd.read_csv(previous_path)
    changed = df.merge(prev_df, indicator=True, how="outer")
    changed = changed[changed["_merge"] != "both"]
    if not changed.empty:
        st.expander("Changes since last save").dataframe(changed)

# Editable grid
gb = GridOptionsBuilder.from_dataframe(df)
gb.configure_default_column(editable=True)
grid_response = AgGrid(df, gridOptions=gb.build(), update_mode="MODEL_CHANGED", editable=True, fit_columns_on_grid_load=True)
updated_df = pd.DataFrame(grid_response["data"])

if st.button("Save orders"):
    updated_df.to_csv(previous_path, index=False)
    st.success("Orders saved to saved_orders.csv")
main
