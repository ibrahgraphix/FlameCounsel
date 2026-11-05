Dim WinHttpReq
Set WinHttpReq = CreateObject("Microsoft.XMLHTTP")
WinHttpReq.Open "GET", "https://dnsexit.com", false
WinHttpReq.Send
