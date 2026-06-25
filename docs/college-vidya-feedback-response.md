# Response to College Vidya Feedback on SARA Analytics

Hi College Vidya Team,

Thank you for the detailed feedback on the SARA analytics dashboard. The points are extremely useful for us, especially because they move the dashboard beyond call-level reporting and toward the full lead lifecycle.

We agree with the broader direction of the feedback. The dashboard should not only answer “how many calls happened?” or “how many leads were qualified?” It should help both teams understand whether SARA is improving the actual business funnel, where leads are leaking, and how we can improve retry, routing, counselor follow-up, WhatsApp journeys, and eventual admissions.

From our side, we see the key questions as:

- Are SARA-qualified leads actually converting?
- Are uncertain / not-interested labels reliable?
- Are high-intent leads being missed after handoff?
- Are counselors becoming more productive because of SARA?
- Which stages or substages leak leads?
- Can we use SARA data to improve retry, routing, WhatsApp, and counselor workflows?

These are the right questions to ask, and we believe this can become a much stronger joint analytics layer between College Vidya and Monade.

## Dashboard Updates We Are Working On

Several of the visual and metric-level suggestions are already being worked on from our side.

We are adding or improving:

- Unique leads connected, so total call volume and unique connected lead volume can be separated.
- Qualified leads as a percentage of total leads / attempted leads, not only connected calls.
- More percentage views across the dashboard wherever counts alone are not enough.
- High-confidence qualified leads, for example qualified leads with confidence score above 80.
- Better substage visibility for uncertain and not-interested leads.
- Retry bucket views so fresh leads and repeated attempts are not mixed together.
- Clearer explanations / info labels for metrics where the meaning may not be immediately obvious.

We completely agree that uncertain and not-interested leads should not remain broad buckets. Substages will make the dashboard much more actionable and will help both teams decide what should be retried, routed differently, or audited.

## Fresh Leads vs Retry Volume

We also agree that fresh lead performance should be separated from retry-heavy volume. Otherwise, call volume can look high while the quality of new pipeline may not be clear.

From the Monade/SARA call analytics side, we can mostly separate this already.

We can identify:

- First attempt leads
- Retry 1 / Retry 2 / Retry 3 leads
- Unique leads attempted
- Total call attempts
- Unique leads connected
- Repeat volume
- Retry-heavy calls
- Lead-level attempt count by phone number or contact ID

This means we can show:

- Fresh leads attempted
- Fresh leads connected
- Fresh leads qualified
- Retry leads attempted
- Retry leads connected
- Retry leads qualified
- Qualification rate by attempt number
- Connectivity rate by attempt number

This should make the dashboard much more useful operationally because both teams can see whether growth is coming from new lead quality or repeated retry volume.

The only limitation is deduplication quality. If the same lead appears under different campaigns or contact IDs, we can dedupe using phone number. If College Vidya has a stable CRM lead ID, using that as a matching key would make this even more accurate.

## North Star Metric and Admission Conversion

One important clarification we would like from the College Vidya team is around the “North Star Metric.”

Our assumption is that this may refer to admission / enrollment conversion, or qualified-to-admission conversion, but we do not want to assume incorrectly. It would be helpful if College Vidya can confirm the exact North Star Metric the dashboard should optimize around.

If the North Star Metric is admission or enrollment, then SARA data alone cannot measure it completely. SARA can tell us:

- who was qualified,
- who was uncertain,
- who was not interested,
- who showed high intent,
- what course or mode they discussed,
- when they were handed off,
- and what confidence score or substage they had.

But final admission, counselor follow-up, and downstream conversion sit on the College Vidya side. To measure those accurately, a minimal shared event feed would be very helpful.

This does not need broad CRM access or unnecessary personal data. A lightweight feed using CRM lead ID, hashed phone number, or another agreed matching key would be enough.

For example, useful lifecycle events could include:

- SARA handoff received
- Counselor assigned
- First counselor contact attempted
- First counselor contact connected
- Counselor disposition
- Course / department mapped
- Admission or enrollment status
- Lost / dropped reason, if available

With this, both teams can answer the most important business questions:

- Of leads SARA marked qualified, how many admitted?
- Of uncertain leads, which substages eventually converted?
- Did any not-interested leads later admit?
- Were any high-confidence leads missed after handoff?
- How quickly did counselors contact SARA-qualified leads?
- Which handoff or follow-up stages are leaking leads?

This would make the dashboard much more than a reporting layer. It would become a shared view of the full funnel from SARA conversation to College Vidya outcome.

## Lead Leakage and High-Intent Leads

One area we believe is especially important is high-intent lead visibility.

For example, if a student clearly agrees to online education during the SARA call, has strong qualification signals, and receives a high confidence score, that lead should ideally not be missed or dropped later in the lifecycle.

If Monade and College Vidya can jointly track these high-intent leads, both teams can identify:

- qualified leads not followed up quickly,
- high-score leads that did not reach a counselor,
- uncertain leads that deserved a retry,
- not-interested labels that may need audit,
- course-interest patterns that may need better routing,
- and handoff gaps between SARA and counselor workflows.

This can directly improve conversion because we would not just be measuring outcomes; we would be finding where strong leads are being lost.

## Uncertain Leads, Substages, and Retry Logic

We strongly agree with the suggestion to make uncertain leads more actionable.

Instead of treating uncertain as one large bucket, both teams can define substages such as:

- disconnected early,
- wrong timing,
- callback requested,
- language barrier,
- low-information call,
- course mismatch,
- undecided,
- high-intent but incomplete qualification.

Once substages are agreed, retry logic can become smarter. For example:

- Wrong timing can trigger a preferred-time callback.
- Early disconnect can trigger another attempt later.
- Course mismatch can route to a different department if College Vidya supports that course.
- High-intent incomplete leads can be prioritized for counselor follow-up.

This is a very useful direction, and we would like to work with the College Vidya team to build this properly.

## WhatsApp Flow

The WhatsApp tracking suggestion is also aligned with how we think the journey should evolve.

The ideal flow would track:

sent → delivered → read → replied → re-engaged into a call → qualified / admitted

From Monade’s side, we can support this type of event tracking. The dependency is that we are yet to receive the required WhatsApp WABA credentials and auth tokens. Once those are available, we can build the WhatsApp journey in a similar structure to what has been described.

## Suggested Way Forward

Our suggestion is to have a short joint working session between College Vidya and Monade to align on:

1. The exact North Star Metric.
2. The SARA stage and substage definitions.
3. Fresh vs retry lead definitions.
4. The minimal lifecycle event feed needed from College Vidya.
5. The lead matching key, such as CRM lead ID or hashed phone number.
6. Counselor/admission lifecycle events.
7. WhatsApp credential handoff and event tracking.

We believe this will help both teams move from dashboard reporting to full-funnel improvement. The goal is to make sure high-intent leads are not missed, uncertain leads are handled intelligently, and both teams get a clearer view of where conversion can be improved.

Thank you again for the feedback. It opens up a very useful next layer for the SARA analytics work, and we are aligned with the direction.

---

WhatsApp message draft:

Hey Sarthak, apologies for the delayed response.

First of all, thanks a lot for the invaluable feedback. It has opened up a lot of useful directions for us, especially around making the dashboard more focused on the full lead lifecycle rather than only call-level analytics.

We are already working on the dashboard fixes and visual improvements mentioned. There are also a few points and suggestions where we would love your clarification, especially around the North Star Metric, admission/conversion tracking, substages, retry logic, and lifecycle visibility after SARA handoff.

I have added our thoughts in this short note. In summary, the key questions we think are worth solving together are:

- Are SARA-qualified leads actually converting?
- Are uncertain / not-interested labels reliable?
- Are high-intent leads being missed after handoff?
- Are counselors becoming more productive because of SARA?
- Which stages or substages leak leads?
- Can we use SARA data to improve retry, routing, WhatsApp, and counselor workflows?

Please have a look whenever convenient. We are fully aligned with the direction and would love to work with your team to make this dashboard and the overall SARA workflow much more actionable.
