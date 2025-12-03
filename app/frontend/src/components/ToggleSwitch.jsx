import { Switch } from "@chakra-ui/react"

const ToggleSwitch = ({isPdfMode, setIsPdfMode}) => {
    
  return (
    <Switch.Root checked={isPdfMode} onCheckedChange={(e) => setIsPdfMode(e.checked)}>
      <Switch.Label>PDF Mode</Switch.Label>
      <Switch.HiddenInput />
      <Switch.Control />
      <Switch.Label>Tex Mode</Switch.Label>
    </Switch.Root>
  )
}

export default ToggleSwitch;
