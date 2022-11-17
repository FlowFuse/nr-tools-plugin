import RED from 'node-red'
import $ from 'jquery'
import { snapshotSection } from './snapshotSection'

const mainPane = {
    id: 'main',
    onshow: () => {},
    content: () => {
        const pane = $(`
<div class="ff-nr-tools-pane">
    <div class="ff-nr-tools-pane-stack">
    </div>
</div>`)

        const sections = RED.stack.create({
            container: pane.find('.ff-nr-tools-pane-stack'),
            singleExpanded: true
        })
        snapshotSection(sections)
        return pane
    }
}

export {
    mainPane
}
