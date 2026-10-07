import { useContext } from 'react';
import { AssistantContext } from './assistant-context-value';

// open({ surface, contextKey, context, currentText, title, onApprove(draft), seedText })
//   surface     campaign_message | auto_campaign_playbook | flow | product_description | general
//   contextKey  stable id of the box it was opened from, so opening the same box resumes its conversation
//   context     plain object describing what the owner is working on (sent to the AI, sanitized by the backend)
//   currentText what is in the box right now, so the AI can improve it
//   onApprove   called with the draft ({type:'text', text} or {type:'flow', ...}) when the owner presses Approve
export function useAssistant() {
  const value = useContext(AssistantContext);
  if (!value) throw new Error('useAssistant must be used within an AssistantProvider');
  return value;
}
