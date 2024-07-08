from __future__ import annotations

from typing import Any, Dict, Optional

from mage_ai.data_preparation.models.block import Block as BlockBase
from mage_ai.data_preparation.models.constants import BlockType
from mage_ai.data_preparation.models.pipeline import Pipeline as PipelineBase
from mage_ai.frameworks.execution.models.block.models import Configuration
from mage_ai.shared.hash import extract
from mage_ai.shared.models import DelegatorTarget
from mage_ai.shared.utils import get_absolute_path
from mage_ai.system.browser.models import Item


class Block(DelegatorTarget):
    def __init__(
        self,
        block: BlockBase,
        pipeline: Optional[PipelineBase] = None,
    ):
        super().__init__(block)
        self.block = block
        self.pipeline_child = pipeline

    @classmethod
    async def create(cls, uuid: str, pipeline: Any, payload: Dict[str, Any]) -> Block:
        configuration_payload = payload.get('configuration', {})

        if 'templates' in configuration_payload:
            for template_uuid, temp_config in configuration_payload.get('templates', {}).items():
                if 'uuid' not in temp_config:
                    continue
                configuration = Configuration.load(**configuration_payload)

                if configuration and configuration.templates:
                    template = configuration.templates[template_uuid]
                    if template:
                        payload.update(template.setup_block_config(payload))
                        print('CHECK2', payload)

        if not payload.get('type'):
            raise Exception('Block type is required')

        block_base = BlockBase.create(
            payload.get('name') or uuid,
            block_type=payload['type'],
            repo_path=pipeline.repo_path,
            pipeline=pipeline,
            **extract(
                payload,
                [
                    'config',
                    'configuration',
                    'groups',
                ],
            ),
        )
        block = cls(block=block_base)
        if BlockType.PIPELINE == block.type:
            await block.create_pipeline_child()

        await pipeline.add_block(block)

        return block

    async def create_pipeline_child(self):
        self.pipeline_child = PipelineBase.create(self.name or self.uuid, self.repo_path)

    async def to_dict_async(self, *args, **kwargs) -> Dict:
        config = self.configuration or {}
        config['file'] = Item.load(
          path=get_absolute_path(self.file.file_path)).to_dict() if self.file else None

        return dict(
            configuration=config,
            downstream_blocks=[b.uuid for b in (self.downstream_blocks or [])],
            groups=self.groups,
            language=self.language,
            name=self.name,
            type=self.type,
            upstream_blocks=[b.uuid for b in (self.upstream_blocks or [])],
            uuid=self.uuid,
        )
