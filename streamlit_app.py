import streamlit as st
import pandas as pd

st.title("🎈 My new app")
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

# Display editable grid and capture updates using Streamlit's built-in editor
edited_df = st.data_editor(df, num_rows="dynamic", use_container_width=True)

if st.button("Save to CSV"):
    edited_df.to_csv("tasks.csv", index=False)
    st.success("Saved updates to tasks.csv")
