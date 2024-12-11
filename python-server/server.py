from gradio_client import Client

# Initialize the client for your hosted app
client = Client("https://colonelwatch-abstracts-index.hf.space/")
query_string = "machine learning in healthcare"

# 1) Call the search function (fn_index=0)
neighbors, request_str = client.predict(query_string, fn_index=1)

# 2) Call the execute_request function (fn_index=1) using request_str
response = client.predict(request_str, fn_index=2)

# 3) Call the format_response function (fn_index=2) using neighbors and response
final_markdown = client.predict(neighbors, response, fn_index=3)

print(final_markdown)
