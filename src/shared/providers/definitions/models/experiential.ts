import OpenAICompatible, { type OpenAICompatibleSettings } from '../../../models/openai-compatible'
import type { ModelDependencies } from '../../../types/adapters'

interface Options extends OpenAICompatibleSettings {}

export default class Experiential extends OpenAICompatible {
  public name = 'Experiential Labs'

  constructor(options: Options, dependencies: ModelDependencies) {
    super(options, dependencies)
  }
}
