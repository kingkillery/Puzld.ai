---
name: self-discover
description: Atomic problem analysis using SELF-DISCOVER v5 with structured meta-reasoning and verification design.
---

# SELF-DISCOVER v5

You must analyze tasks and output exactly one INI-TSV block inside a code fence.
No extra commentary outside the code fence.

Phases:
1) SELECT - choose modules based on task type
2) IMPLEMENT - create detailed execution plan
3) VERIFY - define QA gates and parity checks

Core modules (always active):
- Define_Task_Contract
- Define_IO
- Decompose_Task
- Tool_Selection

Optional modules (select only if they add steps):
- Verification_Strategy
- Fault_Tolerance
- Security_Preflight
- Algorithmic_Complexity
- Edge_Case_Scan
- Grounding_and_Source
- Ensemble_Parity_Check
- Adversarial_Sim_Review
- Meta_Reasoning_Refinement

Output format: exactly one INI-TSV block with tabs between columns.
Use ISO8601Z timestamps.

Template:
```ini
[SELECT v5]
meta\ttask_type\ttimestamp_utc
<task_type>\t<ISO8601Z timestamp>
selected_modules\ttier\tname\twhy
core\t1\tDefine_Task_Contract\talways
core\t2\tDefine_IO\talways
core\t3\tDecompose_Task\talways
core\t4\tTool_Selection\talways
opt\t5\t<ModuleName>\t<why this is needed>

[IMPLEMENT v5]
constraints\tperformance_budget_ms\tmax_retries
5000\t3
meta\ttimestamp_utc\tcache_key
<ISO8601Z timestamp>\tH(<task_type>)
success_criteria\titem
all_tests_pass
no_secrets_leaked
parity_check_success
self_correction_verified
stop_condition\ttext
all success_criteria true
telemetry\tfields
trace_id;task_type;step_key;tool;latency_ms;status
steps\tkey\taction\tinputs_csv\toutputs_csv\ttool\tguardrails_csv\ton_error_retry\ton_error_fallback\ton_error_log
step01_contract\tDefine task contract\tdescription\tcontract\tnone\tprechecks,security\tnone\tfail_fast\tclass,msg,attempts,elapsed
step02_io\tDefine IO + validation\tcontract\tio_spec\tnone\tprechecks\tnone\tfail_fast\tclass,msg,attempts,elapsed
step03_decompose\tDecompose into minimal steps\tio_spec\tstep_plan\tnone\tdeterminism\tnone\tfail_fast\tclass,msg,attempts,elapsed
step04_tools\tSelect tools + safety envelope\tstep_plan\ttool_plan\tnone\tdom_safety,resource_caps\tnone\tfail_fast\tclass,msg,attempts,elapsed
step60_adversarial\t(if selected) Review failure modes\tstep_plan\trisk_mitigation\tnone\tcritique\tnone\tfail_fast\tstatus,elapsed
step65_self_correct\t(if selected) Refine plan via critique\tstep_plan,risk_mitigation\trefined_plan\tnone\tself_critique\tnone\tfail_fast\tstatus,elapsed
step70_parity\t(if selected) Dual-path cross-check\tio_spec\tparity_spec\tnone\tverification\tnone\tfail_fast\tstatus,elapsed
step90_execute\tExecute using tools\ttool_plan\tartifacts\t<tool>\tresource_caps\tjitter2\trollback\tclass,msg,attempts,elapsed
step95_verify\tInvoke parity + verification\tartifacts,parity_spec\tqa_report\tnone\ttests,redaction\tnone\tfail_fast\tstatus,elapsed
step99_answer\tEmit final_answer\tqa_report\tfinal_answer\tnone\tredaction\tnone\tfail_fast\tstatus,elapsed

[VERIFY v5]
meta\ttrace_id\ttask_type\ttimestamp_utc\tperformance_budget_ms
<uuid>\t<task_type>\t<ISO8601Z timestamp>\t5000
execution_log\tstep_key\taction_taken\ttool\targs_redacted\tquery_if_browse\tsources_csv\tartifacts_csv\tnotes_2lines
<row>\t<step_key>\t<brief>\t<tool>\t<redacted>\t<query or ->\t<UrlA;UrlB or ->\t</tmp/a or ->\t<line1; line2>
qa_checks\tgate\tstatus\tevidence
<row>\ttests_passed\tpass|fail\t<summary>
<row>\tno_secrets_leaked\tpass|fail\t<summary>
<row>\tparity_cross_check\tpass|fail\t<summary>
meta_analysis\ttype\tobservation\tresolution
<row>\tconflict_detection\t<what conflicted>\t<how it was resolved>
<row>\tself_correction\t<what was fixed>\t<how fix was applied>
final_answer\tformat\tconfidence\tvalue
<final_format>\t0.00-1.00\t<brief or pointer to artifact>
residual_risks\titem
<row>\t<risk or ->
```
