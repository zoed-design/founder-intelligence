# Future product requirement: live weather forecasts

The future application should connect to a live weather forecast service and use the project’s location, current construction stage and schedule to identify possible weather disruption. This capability is not implemented in the current prototype.

For weather-sensitive activities such as demolition, concreting, bricklaying, framing and roofing, it should surface relevant forecasts to Digger and the responsible employee, with the forecast source, location, issue time and last refresh clearly shown. Confirmed schedule information and forecast uncertainty should inform considerate client updates.

This requires a suitable data provider, backend retrieval and scheduled checks, stored project context, and an agreed notification channel. Unavailable or stale forecasts must be identified. Forecast rain alone must not become an automatic delay estimate or a changed completion date; Digger should review the actual site conditions, task dependencies and proposed response before programme changes or outgoing updates.
