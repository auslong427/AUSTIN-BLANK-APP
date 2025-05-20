import streamlit as st
import pandas as pd
from st_aggrid import AgGrid, GridOptionsBuilder

st.title("🎈 My new app")

# Provide a quick link to the hosted version of this demo
st.markdown(
    "[Open this app in a new tab](https://blank-app-template.streamlit.app/)"
)
st.write(
    "Let's start building! For help and inspiration, head over to [docs.streamlit.io](https://docs.streamlit.io/)."
)

st.header("Project tasks")

# Initial task data
df = pd.DataFrame(
    [
        {"Task": "Plan project", "Owner": "Alice", "Done": False},
        {"Task": "Develop feature", "Owner": "Bob", "Done": False},
        {"Task": "Write docs", "Owner": "Charlie", "Done": False},
    ]
)

# Configure AgGrid to allow editing
gb = GridOptionsBuilder.from_dataframe(df)
gb.configure_default_column(editable=True)
grid_options = gb.build()

# Display editable grid and capture updates
grid_response = AgGrid(df, gridOptions=grid_options, update_mode="MODEL_CHANGED", editable=True)
updated_df = pd.DataFrame(grid_response["data"])

if st.button("Save to CSV"):
    updated_df.to_csv("tasks.csv", index=False)
    st.success("Saved updates to tasks.csv")
