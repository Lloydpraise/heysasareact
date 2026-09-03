// listsCampaigns/components/automationRules/AutomationRulesTab.jsx
import { useState } from 'react';
import { AUTOMATION_RULES } from '../../constants';
import { toggleAutomationRule, updateRuleFactors } from '../../../../services/listsCampaignsService';
import RuleToggleRow from './RuleToggleRow';
import RuleConfigureDrawer from './RuleConfigureDrawer';
import { useListsCampaigns } from '../../ListsCampaignsContext';

export default function AutomationRulesTab() {
  const { businessId, ruleStatuses, refetchRules, setRuleStatus } = useListsCampaigns();
  const [configuringRule, setConfiguringRule] = useState(null);

  const handleToggle = async (ruleId, enabled) => {
    setRuleStatus(ruleId, (current) => ({ ...current, enabled, disabled_at: enabled ? null : new Date().toISOString() }));
    try {
      await toggleAutomationRule(businessId, ruleId, enabled);
      await refetchRules();
    } catch (toggleError) {
      setRuleStatus(ruleId, (current) => ({ ...current, enabled: !enabled }));
      console.error('Unable to update automation rule', toggleError);
    }
  };

  const handleSaveFactors = async (ruleId, factors) => {
    await updateRuleFactors(businessId, ruleId, factors);
    setConfiguringRule(null);
    refetchRules();
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900">Automation Rules</h2>
        <p className="text-[12.5px] text-slate-500">
          Choose which lists build themselves automatically. Turning a rule off hides its list
          for 30 days before removal - turn it back on any time to restore it.
        </p>
      </div>

      {AUTOMATION_RULES.map((rule) => (
        <RuleToggleRow
          key={rule.id}
          rule={rule}
          status={ruleStatuses?.[rule.id]}
          onToggle={handleToggle}
          onConfigure={setConfiguringRule}
        />
      ))}

      {configuringRule && (
        <RuleConfigureDrawer
          rule={configuringRule}
          currentFactors={ruleStatuses?.[configuringRule.id]?.factors}
          onSave={handleSaveFactors}
          onClose={() => setConfiguringRule(null)}
        />
      )}
    </div>
  );
}