# 🎈 Blank app template

A simple Streamlit app template for you to modify!

[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://blank-app-template.streamlit.app/)

### How to run it on your own machine

1. Install the requirements

   ```
   $ pip install -r requirements.txt
   ```

2. Run the app

   ```
   $ streamlit run streamlit_app.py
   ```

### Using the sales order tracker

Upload a CSV file with your sales orders or use the bundled `sample_sales_orders.csv`.
The app automatically maps common column names, generates `item_id` values and
marks late orders. Edit the table directly in your browser and click **Save
orders** to write updates to `saved_orders.csv`.

